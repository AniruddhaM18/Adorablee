import { Request, Response } from "express";
import { prisma, Prisma } from "@repo/database";
import { runEditAgentStream, runErrorFixStream } from "../editAgent.js";
import { updateSandboxFiles, updateSandboxFilesTemporary, validateSandboxBuild } from "../sandbox.js";
import { FileChange } from "../modifyTools.js";

// Constants for error recovery
const MAX_FIX_ATTEMPTS = 3;

/// Helper to convert nested files object to flat Record<string, string> 

function flattenFiles(
    files: any,
    prefix: string = ""
): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(files)) {
        const path = prefix ? `${prefix}/${key}` : key;

        if (typeof value === "string") {
            // It's file content
            result[path] = value;
        } else if (value && typeof value === "object") {
            if ("content" in value && typeof (value as any).content === "string") {
                // It's a file object with content property
                result[path] = (value as any).content;
            } else {
                // It's a directory, recurse
                Object.assign(result, flattenFiles(value, path));
            }
        }
    }

    return result;
}

//Helper to apply file changes to existing files 

function applyFileChanges(
    currentFiles: Record<string, string>,
    changes: FileChange[]
): Record<string, string> {
    const newFiles = { ...currentFiles };

    for (const change of changes) {
        if (change.action === "delete") {
            delete newFiles[change.path];
        } else {
            // create or modify
            newFiles[change.path] = change.content;
        }
    }

    return newFiles;
}

//Helper to convert flat files back to nested structure 

function unflattenFiles(flatFiles: Record<string, string>): any {
    const result: any = {};

    for (const [path, content] of Object.entries(flatFiles)) {
        const parts = path.split("/");
        let current = result;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        const fileName = parts[parts.length - 1];
        current[fileName] = { content };
    }

    return result;
}

// Edit project via chat 

export async function editProjectChat(req: Request, res: Response) {
    const { projectId } = req.params;
    const userId = req.user?.id;

    // Parse payload
    let payload: any;
    try {
        if (typeof req.query.payload !== "string") {
            return res.status(400).json({ error: "Missing payload" });
        }
        payload = JSON.parse(req.query.payload);
    } catch (err) {
        console.error("Invalid payload", err);
        return res.status(400).json({ error: "Invalid payload" });
    }

    const messages = payload?.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "No messages provided" });
    }

    // Auth check
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch project
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        include: { version: true },
    });

    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }

    const currentVersion = project.version.find(
        (v) => v.id === project.currentVersionId
    );

    if (!currentVersion) {
        return res.status(500).json({ error: "Current version not found" });
    }

    // Flatten current files for the prompt
    const currentFiles = flattenFiles(currentVersion.files);

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    res.write(": connected\n\n");

    try {
        // Get the latest user message
        const latestMessage = messages[messages.length - 1];
        const chatHistory = messages.slice(0, -1);

        // Run the edit agent
        const fileChanges = await runEditAgentStream(
            currentFiles,
            latestMessage.content,
            chatHistory,
            (event) => {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
        );

        console.log(`Edit agent returned ${fileChanges.length} file changes:`, fileChanges.map(f => f.path));

        // If we have file changes, validate and potentially fix them
        if (fileChanges.length > 0) {
            let updatedFiles = applyFileChanges(currentFiles, fileChanges);

            // Extract sandboxId from preview URL for validation
            const urlMatch = project.previewUrl.match(/https:\/\/\d+-([^.]+)\.e2b\.app/);
            const sandboxId = urlMatch ? urlMatch[1] : null;

            // Run validation loop if we have a sandbox
            if (sandboxId) {
                let currentFilesToValidate = updatedFiles;
                let fixAttempts = 0;
                let buildSuccess = false;

                while (!buildSuccess && fixAttempts < MAX_FIX_ATTEMPTS) {
                    // Write files temporarily to sandbox for validation
                    res.write(`data: ${JSON.stringify({ type: "status", message: "Validating code..." })}\n\n`);
                    console.log(`Validation attempt ${fixAttempts + 1}: Writing files to sandbox for validation`);

                    try {
                        await updateSandboxFilesTemporary(sandboxId, currentFilesToValidate);
                    } catch (tempErr) {
                        console.error("Failed to write temp files to sandbox:", tempErr);
                        break; // Can't validate, proceed anyway
                    }

                    // Run build validation
                    try {
                        const validation = await validateSandboxBuild(sandboxId);

                        if (validation.success) {
                            console.log("Build validation passed!");
                            buildSuccess = true;
                            updatedFiles = currentFilesToValidate;
                        } else {
                            fixAttempts++;
                            console.log(`Build failed (attempt ${fixAttempts}/${MAX_FIX_ATTEMPTS}). Errors:\n${validation.errors}`);

                            if (fixAttempts < MAX_FIX_ATTEMPTS) {
                                res.write(`data: ${JSON.stringify({
                                    type: "status",
                                    message: `Fixing errors (attempt ${fixAttempts}/${MAX_FIX_ATTEMPTS})...`
                                })}\n\n`);

                                // Run AI error fix
                                const fixChanges = await runErrorFixStream(
                                    currentFilesToValidate,
                                    validation.errors || "Build failed with unknown errors",
                                    (event) => {
                                        res.write(`data: ${JSON.stringify(event)}\n\n`);
                                    }
                                );

                                if (fixChanges.length > 0) {
                                    currentFilesToValidate = applyFileChanges(currentFilesToValidate, fixChanges);
                                    console.log(`Applied ${fixChanges.length} fixes. Revalidating...`);
                                } else {
                                    console.log("No fixes generated, stopping retry loop");
                                    break;
                                }
                            } else {
                                // Max retries reached - still save but warn user
                                res.write(`data: ${JSON.stringify({
                                    type: "warning",
                                    message: "Build validation failed after max retries. Code saved but may contain errors."
                                })}\n\n`);
                                updatedFiles = currentFilesToValidate;
                            }
                        }
                    } catch (validationErr) {
                        console.error("Validation error:", validationErr);
                        break; // Can't validate, proceed anyway
                    }
                }
            }

            // Create new version - store flat format to match initial project creation
            const newVersion = await prisma.version.create({
                data: {
                    projectId: project.id,
                    files: updatedFiles,
                    prompt: latestMessage.content,
                },
            });

            // Update project to point to new version
            await prisma.project.update({
                where: { id: project.id },
                data: { currentVersionId: newVersion.id },
            });

            // Try to update the sandbox with final files
            if (sandboxId) {
                try {
                    console.log(`Updating sandbox with final files: ${sandboxId}`);
                    await updateSandboxFiles(sandboxId, updatedFiles);
                } catch (sandboxErr) {
                    console.error("Failed to update sandbox:", sandboxErr);
                }
            }

            // Notify frontend about the completed update
            console.log(`Sending version_created event with ${Object.keys(updatedFiles).length} files`);
            res.write(
                `data: ${JSON.stringify({
                    type: "version_created",
                    versionId: newVersion.id,
                    files: updatedFiles,
                })}\n\n`
            );
        }
    } catch (err) {
        console.error("Edit agent error:", err);
        res.write(
            `data: ${JSON.stringify({
                type: "error",
                message: "Failed to process edit request",
            })}\n\n`
        );
    } finally {
        res.end();
    }
}

import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { Sandbox } from "@e2b/code-interpreter";
import { deployToCloudflareViaSandbox } from "../cloudflare.js";
import { createSandbox } from "../sandbox.js";

// Helper to convert nested files object to flat Record<string, string>
function flattenFiles(
    files: any,
    prefix: string = ""
): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(files)) {
        const path = prefix ? `${prefix}/${key}` : key;

        if (typeof value === "string") {
            result[path] = value;
        } else if (value && typeof value === "object") {
            if ("content" in value && typeof (value as any).content === "string") {
                result[path] = (value as any).content;
            } else {
                Object.assign(result, flattenFiles(value, path));
            }
        }
    }

    return result;
}

export async function deployProject(req: Request, res: Response) {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch project with versions
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
        include: { version: true },
    });

    if (!project) {
        return res.status(404).json({ error: "Project not found" });
    }

    if (!project.name) {
        return res.status(400).json({ error: "Project name is missing" });
    }

    // Get current version files
    const currentVersion = project.version.find(
        (v) => v.id === project.currentVersionId
    );

    if (!currentVersion) {
        return res.status(400).json({ error: "Current version not found" });
    }

    const projectFiles = flattenFiles(currentVersion.files);

    try {
        let sbx: Sandbox;
        let sandboxId: string | null = null;

        // Try to extract sandboxId from preview URL
        const urlMatch = project.previewUrl.match(/https:\/\/\d+-([^.]+)\.e2b\.app/);
        if (urlMatch) {
            sandboxId = urlMatch[1];
        }

        // Try to connect to existing sandbox, or create a new one if it's paused/expired
        if (sandboxId) {
            try {
                console.log(`Attempting to connect to existing sandbox: ${sandboxId}`);
                sbx = await Sandbox.connect(sandboxId);
                console.log("Successfully connected to existing sandbox");
            } catch (error: any) {
                // If sandbox is paused/expired, create a new one
                if (error.message?.includes("not found") || error.message?.includes("Paused")) {
                    console.log("Sandbox is paused/expired, creating new sandbox from project files...");
                    const newSandbox = await createSandbox(projectFiles);
                    sbx = await Sandbox.connect(newSandbox.sandboxId);
                    
                    // Update preview URL in database
                    await prisma.project.update({
                        where: { id: projectId },
                        data: { previewUrl: newSandbox.url },
                    });
                    console.log(`Created new sandbox: ${newSandbox.sandboxId}`);
                } else {
                    throw error;
                }
            }
        } else {
            // No sandbox exists, create a new one
            console.log("No sandbox found, creating new sandbox from project files...");
            const newSandbox = await createSandbox(projectFiles);
            sbx = await Sandbox.connect(newSandbox.sandboxId);
            
            // Update preview URL in database
            await prisma.project.update({
                where: { id: projectId },
                data: { previewUrl: newSandbox.url },
            });
            console.log(`Created new sandbox: ${newSandbox.sandboxId}`);
        }

        // Deploy using wrangler in sandbox
        const result = await deployToCloudflareViaSandbox(sbx, project.name);

        if (!result.success) {
            console.error("Deployment failed:", result.error);
            return res.status(500).json({
                error: "Deployment failed",
                details: result.error
            });
        }

        // Save deployed URL to database
        await prisma.project.update({
            where: { id: projectId },
            data: { deployedUrl: result.url },
        });

        console.log(`Project deployed: ${result.url}`);

        return res.json({
            success: true,
            url: result.url,
        });

    } catch (error: any) {
        console.error("Deploy error:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
            error: "Deployment failed",
            details: error.message || String(error)
        });
    }
}

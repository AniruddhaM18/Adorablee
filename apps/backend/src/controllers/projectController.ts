import { prisma, Prisma } from "@repo/database";
import { Request, Response } from "express";
import { runUserRequest, runProjectStream } from "../agent.js";
import { assembleProject } from "../projectAssembler.js";
import { BASE_TEMPLATE } from "../baseTemplate.js";
import { createSandbox, isSandboxAlive, resurrectSandbox } from "../sandbox.js";

export async function createProject(req: Request, res: Response) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      success: false,
      message: "Prompt not found",
    });
  }

  console.log("prompt received");

  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {

    const result = await runUserRequest(prompt);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.error ?? "AI generation failed",
      });
    }

    if (!Array.isArray(result.files) || result.files.length === 0) {
      return res.status(200).json({
        success: false,
        message: "AI did not generate any files",
      });
    }

    // assembling files
    const projectFiles = await assembleProject(result.files);

    const { project, version } = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const project = await tx.project.create({
          data: {
            userId,
            name: result.projectName ?? "Untitled Project",
            previewUrl: "",
            currentVersionId: "",
            staus: "creating",
          },
        });

        const version = await tx.version.create({
          data: {
            projectId: project.id,
            files: projectFiles,
            prompt,
          },
        });

        return { project, version };
      }
    );

    // sandbox
    let sandbox;
    try {
      sandbox = await createSandbox(projectFiles);
    } catch (err) {
      await prisma.project.update({
        where: { id: project.id },
        data: { staus: "failed" },
      });

      return res.status(500).json({
        success: false,
        message: "Sandbox creation failed",
      });
    }

    // finalize project
    await prisma.project.update({
      where: { id: project.id },
      data: {
        previewUrl: sandbox.url,
        currentVersionId: version.id,
        staus: "ready",
      },
    });

    return res.status(201).json({
      success: true,
      projectId: project.id,
      previewUrl: sandbox.url,
    });
  } catch (err) {
    console.error("Create project failed:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

/** SSE stream: same as create but streams LangGraph log events then sends project result. No extra tool calls. */
export async function createProjectStream(req: Request, res: Response) {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ success: false, message: "Prompt not found" });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: object) => res.write(`data: ${JSON.stringify(event)}\n\n`);
  console.log("prompt received");
  send({ type: "log", message: "prompt received" });

  try {
    const result = await runProjectStream(prompt, (event) => {
      if (event.type === "log" && event.message) {
        send({ type: "log", message: event.message });
      } else if (event.type === "result" && event.result) {
        send({ type: "result", result: event.result });
      }
    });

    if (!result.success) {
      send({ type: "error", message: result.error ?? "AI generation failed" });
      return res.end();
    }

    if (!Array.isArray(result.files) || result.files.length === 0) {
      send({ type: "error", message: "AI did not generate any files" });
      return res.end();
    }

    const projectFiles = await assembleProject(result.files);

    const { project, version } = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const project = await tx.project.create({
          data: {
            userId,
            name: result.projectName ?? "Untitled Project",
            previewUrl: "",
            currentVersionId: "",
            staus: "creating",
          },
        });
        const version = await tx.version.create({
          data: { projectId: project.id, files: projectFiles, prompt },
        });
        return { project, version };
      }
    );

    let sandbox;
    try {
      sandbox = await createSandbox(projectFiles, (msg) =>
        send({ type: "log", message: msg })
      );
    } catch (err) {
      await prisma.project.update({ where: { id: project.id }, data: { staus: "failed" } });
      send({ type: "error", message: "Sandbox creation failed" });
      return res.end();
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { previewUrl: sandbox.url, currentVersionId: version.id, staus: "ready" },
    });

    send({ type: "project", projectId: project.id, previewUrl: sandbox.url });
  } catch (err) {
    console.error("Create project stream failed:", err);
    send({ type: "error", message: "Server error" });
  } finally {
    res.end();
  }
}


// get 

export async function getProject(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        version: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const currentVersion = project.version.find(
      (v) => v.id === project.currentVersionId
    );

    if (!currentVersion) {
      return res.status(500).json({
        success: false,
        message: "Current version not found",
      });
    }

    // Check if sandbox is alive and resurrect if dead
    let previewUrl = project.previewUrl;
    const files = currentVersion.files as Record<string, string>;

    // Extract sandbox ID from preview URL (format: https://{port}-{sandboxId}.e2b.app)
    // Example: https://5173-iy713necyrufqmrktigbq.e2b.app
    const sandboxIdMatch = project.previewUrl.match(/https:\/\/\d+-([a-z0-9]+)\.e2b\.app/);
    const sandboxId = sandboxIdMatch ? sandboxIdMatch[1] : null;

    // Skip resurrection for projects that are still being created or were just created
    // (sandbox may still be booting and would falsely appear dead)
    const SANDBOX_GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes
    const projectAge = Date.now() - new Date(project.createdAt).getTime();
    const isNewlyCreated = projectAge < SANDBOX_GRACE_PERIOD_MS;

    console.log(`Checking sandbox health for project ${project.id}, sandboxId: ${sandboxId}, age: ${Math.round(projectAge / 1000)}s, status: ${project.staus}`);

    if (sandboxId && project.staus !== "creating") {
      // Skip health check for newly created projects — their sandbox is still booting
      const isAlive = isNewlyCreated ? true : await isSandboxAlive(sandboxId);

      if (!isAlive) {
        console.log(`Sandbox ${sandboxId} is dead, resurrecting...`);

        try {
          // Ensure the resurrected sandbox gets the correct vite.config.js
          // with allowedHosts (DB may store an older version without it)
          const resurrectionFiles = { ...files };
          resurrectionFiles["vite.config.js"] = BASE_TEMPLATE["vite.config.js"]!;
          const newSandbox = await resurrectSandbox(resurrectionFiles);
          previewUrl = newSandbox.url;

          // Update project with new preview URL
          await prisma.project.update({
            where: { id: project.id },
            data: { previewUrl: newSandbox.url },
          });

          console.log(`Sandbox resurrected with new URL: ${previewUrl}`);
        } catch (resurrectErr) {
          console.error("Failed to resurrect sandbox:", resurrectErr);
          // Return project anyway, frontend can handle no preview
        }
      }
    }

    return res.status(200).json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        status: project.staus,
        previewUrl,
        deployedUrl: project.deployedUrl,
        currentVersion,
      },
    });
  } catch (err) {
    console.error("Get project failed:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Get all projects for authenticated user
export async function getProjects(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        previewUrl: true,
        deployedUrl: true,
        createdAt: true,
        staus: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, projects });
  } catch (err) {
    console.error("Get projects failed:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Delete a project
export async function deleteProject(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { projectId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Delete versions first (due to foreign key), then project
    await prisma.version.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });

    return res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    console.error("Delete project failed:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
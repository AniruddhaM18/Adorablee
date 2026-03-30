import { Router } from "express";
import { createProject, createProjectStream, getProject, getProjects, deleteProject } from "../controllers/projectController.js";
import { deployProject } from "../controllers/deployController.js";
import { authMiddleware } from "../middleware/middleware.js";
import { heavyAiProjectLimiter } from "../middleware/rateLimits.js";

const projectRouter: Router = Router();

projectRouter.get("/list", authMiddleware, getProjects);
projectRouter.post("/create", authMiddleware, heavyAiProjectLimiter, createProject);
projectRouter.post("/create-stream", authMiddleware, heavyAiProjectLimiter, createProjectStream);
projectRouter.get("/:projectId", authMiddleware, getProject);
projectRouter.delete("/:projectId", authMiddleware, deleteProject);
projectRouter.post("/:projectId/deploy", authMiddleware, deployProject);

export default projectRouter;
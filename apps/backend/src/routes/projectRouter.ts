import { Router } from "express";
import { createProject, createProjectStream, getProject, getProjects, deleteProject } from "../controllers/projectController.js";
import { deployProject } from "../controllers/deployController.js";
import { authMiddleware } from "../middleware/middleware.js";

const projectRouter: Router = Router();

projectRouter.get("/list", authMiddleware, getProjects);
projectRouter.post("/create", authMiddleware, createProject);
projectRouter.post("/create-stream", authMiddleware, createProjectStream);
projectRouter.get("/:projectId", authMiddleware, getProject);
projectRouter.delete("/:projectId", authMiddleware, deleteProject);
projectRouter.post("/:projectId/deploy", authMiddleware, deployProject);

export default projectRouter;
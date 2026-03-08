import { Router } from "express";
import { agentChat } from "../controllers/chatController.js";
import { editProjectChat } from "../controllers/editController.js";
import { authMiddleware } from "../middleware/middleware.js";


const chatRouter: Router = Router();

chatRouter.get("/chat", agentChat);
chatRouter.get("/chat/edit/:projectId", authMiddleware, editProjectChat);

export default chatRouter;


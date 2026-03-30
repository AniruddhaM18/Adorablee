import { Router } from "express";
import { agentChat } from "../controllers/chatController.js";
import { editProjectChat } from "../controllers/editController.js";
import { authMiddleware } from "../middleware/middleware.js";
import { editChatLimiter, publicAgentChatLimiter } from "../middleware/rateLimits.js";

const chatRouter: Router = Router();

chatRouter.get("/chat", publicAgentChatLimiter, agentChat);
chatRouter.get("/chat/edit/:projectId", authMiddleware, editChatLimiter, editProjectChat);

export default chatRouter;


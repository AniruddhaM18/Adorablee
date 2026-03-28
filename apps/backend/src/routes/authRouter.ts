import { Router } from "express";
import { getMe, logout, signin, signup, getApiKeyStatus, updateApiKey, updatePassword } from "../controllers/authControllers.js";
import { authMiddleware } from "../middleware/middleware.js";

const authRouter: Router = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.get("/me", getMe);
authRouter.post("/logout", logout);

// API key management (auth required)
authRouter.get("/api-key", authMiddleware, getApiKeyStatus);
authRouter.put("/api-key", authMiddleware, updateApiKey);

// Password update (auth required)
authRouter.put("/password", authMiddleware, updatePassword);

export default authRouter;
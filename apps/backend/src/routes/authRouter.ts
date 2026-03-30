import { Router } from "express";
import {
  deleteAccount,
  getApiKeyStatus,
  getMe,
  issueSseToken,
  logout,
  signin,
  signup,
  updateApiKey,
  updatePassword,
} from "../controllers/authControllers.js";
import { authMiddleware } from "../middleware/middleware.js";
import { authEmailLimiter } from "../middleware/rateLimits.js";

const authRouter: Router = Router();

authRouter.post("/signup", authEmailLimiter, signup);
authRouter.post("/signin", authEmailLimiter, signin);
authRouter.get("/me", getMe);
authRouter.post("/logout", logout);
authRouter.post("/sse-token", issueSseToken);

// API key management (auth required)
authRouter.get("/api-key", authMiddleware, getApiKeyStatus);
authRouter.put("/api-key", authMiddleware, updateApiKey);

// Password update (auth required)
authRouter.put("/password", authMiddleware, updatePassword);

authRouter.delete("/account", authMiddleware, deleteAccount);

export default authRouter;
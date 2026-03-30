import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

type SessionPayload = JwtPayload & { userId?: string; email?: string; sse?: boolean };

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const queryToken =
      typeof req.query.token === "string" && req.query.token.trim() !== ""
        ? req.query.token
        : undefined;
    const cookieOrHeaderToken =
      req.cookies.sessionToken ||
      req.headers.authorization?.replace("Bearer ", "") ||
      undefined;

    const fromQuery = Boolean(queryToken);
    const token = queryToken ?? cookieOrHeaderToken;

    if (!token) {
      return res.status(401).json({ message: "authentication required" });
    }

    if (!JWT_SECRET) {
      console.error("authMiddleware: JWT_SECRET is not configured");
      return res.status(500).json({ message: "Internal server error" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;

    if (fromQuery && payload.sse !== true) {
      return res.status(401).json({
        message: "Invalid token for query auth — use a short-lived SSE token from POST /auth/sse-token",
      });
    }

    if (!payload.userId || !payload.email) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

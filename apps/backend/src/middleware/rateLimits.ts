import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/** Sign-in / sign-up brute-force protection */
export const authEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Project generation (LLM + sandbox) — per authenticated user */
export const heavyAiProjectLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id ? `u:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? "unknown")}`,
});

/** Unauthenticated playground chat — per IP */
export const publicAgentChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Authenticated edit chat — per user */
export const editChatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id ? `u:${req.user.id}` : `ip:${ipKeyGenerator(req.ip ?? "unknown")}`,
});

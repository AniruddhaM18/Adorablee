import type { CookieOptions } from "express";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sessionCookieSameSite(): "lax" | "strict" | "none" {
  const raw = process.env.SESSION_COOKIE_SAMESITE?.trim().toLowerCase();
  if (raw === "none" || raw === "strict" || raw === "lax") return raw;
  return "lax";
}

export function sessionCookieOptions(): CookieOptions {
  const sameSite = sessionCookieSameSite();
  const secure =
    sameSite === "none" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: MAX_AGE_MS,
  };
}


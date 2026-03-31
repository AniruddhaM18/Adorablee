import type { CookieOptions } from "express";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function sessionCookieOptions(): CookieOptions {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_MS,
  };
}


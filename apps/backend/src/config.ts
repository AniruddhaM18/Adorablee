export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn("[config] OPENROUTER_API_KEY is not set — users must provide their own API key via Settings.");
}

/** Max completion tokens for shared-key (free tier) requests — lowers OpenRouter credit reservation vs model default. */
const fallbackMaxParsed = parseInt(
  process.env.OPENROUTER_FALLBACK_MAX_OUTPUT_TOKENS ?? "",
  10
);
export const OPENROUTER_FALLBACK_MAX_OUTPUT_TOKENS =
  Number.isFinite(fallbackMaxParsed) && fallbackMaxParsed > 0
    ? fallbackMaxParsed
    : 8192;

export const E2B_API_KEY = process.env.E2B_API_KEY;

function requireProdEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Missing required env in production: ${name}`);
  }
  return v.trim();
}

/** Comma-separated browser origins allowed for CORS (e.g. `https://app.example.com,https://preview.example.com`). */
export function getCorsAllowedOrigins(): string[] {
  const raw =
    process.env.NODE_ENV === "production"
      ? requireProdEnv("FRONTEND_URL")
      : (process.env.FRONTEND_URL?.trim() ??
        "http://localhost:3000,http://127.0.0.1:3000");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Referer sent to OpenRouter. `OPENROUTER_HTTP_REFERER` overrides; else first `FRONTEND_URL` origin; else localhost. */
export function getOpenRouterHttpReferer(): string {
  const explicit = process.env.OPENROUTER_HTTP_REFERER?.trim();
  if (explicit) return explicit;
  const first = getCorsAllowedOrigins()[0];
  return first ?? "http://localhost:3000";
}

export const JWT_SECRET =
  process.env.NODE_ENV === "production"
    ? requireProdEnv("JWT_SECRET")
    : process.env.JWT_SECRET;

export const ENCRYPTION_KEY =
  process.env.NODE_ENV === "production"
    ? requireProdEnv("ENCRYPTION_KEY")
    : process.env.ENCRYPTION_KEY;

/// cloudflare
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
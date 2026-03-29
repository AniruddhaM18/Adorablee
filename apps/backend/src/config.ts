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

export const JWT_SECRET = process.env.JWT_SECRET;

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/// cloudflare
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
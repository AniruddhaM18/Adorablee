export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn("[config] OPENROUTER_API_KEY is not set — users must provide their own API key via Settings.");
}

export const E2B_API_KEY = process.env.E2B_API_KEY;

export const JWT_SECRET = process.env.JWT_SECRET;

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/// cloudflare
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
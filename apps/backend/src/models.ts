/** Client-facing model keys (URL / JSON). OpenRouter IDs live only in this map. */

export const DEFAULT_MODEL_KEY = "gemini-3.1-pro";

export const OPENROUTER_MODEL_BY_KEY: Record<string, string> = {
  "gemini-3.1-pro": "google/gemini-3.1-pro-preview",
  "gemini-3-flash-preview": "google/gemini-3-flash-preview",
  "kimi-k2.5": "moonshotai/kimi-k2.5",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "claude-sonnet-4.5": "anthropic/claude-sonnet-4.5",
  "gpt-4o-mini": "openai/gpt-4o-mini",
};

export const DEFAULT_OPENROUTER_MODEL =
  OPENROUTER_MODEL_BY_KEY[DEFAULT_MODEL_KEY]!;

export function resolveOpenRouterModel(clientKey?: string | null): string {
  const trimmed = typeof clientKey === "string" ? clientKey.trim() : "";
  if (!trimmed) return DEFAULT_OPENROUTER_MODEL;
  const id = OPENROUTER_MODEL_BY_KEY[trimmed];
  return id ?? DEFAULT_OPENROUTER_MODEL;
}

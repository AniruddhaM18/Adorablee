/** Public API base URL (browser + server rewrites). Defaults match local `pnpm dev`. */
export const NEXT_PUBLIC_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

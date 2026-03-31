/** Public API base URL (browser + server rewrites). Defaults match local `pnpm dev`. */
const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const isProd = process.env.NODE_ENV === "production";
const isLocalBackend =
  rawBackendUrl === "http://localhost:3001" ||
  rawBackendUrl === "http://127.0.0.1:3001";

if (isProd && (!rawBackendUrl || isLocalBackend)) {
  throw new Error(
    "NEXT_PUBLIC_BACKEND_URL must be set to a non-localhost HTTPS URL in production."
  );
}

export const NEXT_PUBLIC_BACKEND_URL =
  rawBackendUrl ?? "http://localhost:3001";

/** @type {import('next').NextConfig} */
const backendRewriteBase = (() => {
  const explicit = process.env.BACKEND_REWRITE_URL?.trim();
  const publicBackend = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  const value = explicit || publicBackend || "http://localhost:3001";
  const isProd = process.env.NODE_ENV === "production";
  const isLocalhostTarget =
    value === "http://localhost:3001" || value === "http://127.0.0.1:3001";
  if (isProd && isLocalhostTarget) {
    throw new Error(
      "BACKEND_REWRITE_URL (or NEXT_PUBLIC_BACKEND_URL) must not point to localhost in production."
    );
  }
  return value;
})();

const nextConfig = {
  async rewrites() {
    const base = backendRewriteBase.replace(/\/$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${base}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

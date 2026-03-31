/** @type {import('next').NextConfig} */
const backendRewriteBase =
  process.env.BACKEND_REWRITE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

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

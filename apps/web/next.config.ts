/** @type {import('next').NextConfig} */
const backendRewriteBase = "https://api.adorablee.fun";

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

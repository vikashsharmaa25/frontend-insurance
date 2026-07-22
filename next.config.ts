import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://web-production-63f48.up.railway.app"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

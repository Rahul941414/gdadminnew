import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output removed ✅
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;


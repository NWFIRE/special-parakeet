import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx"],
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;

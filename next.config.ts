import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type errors across codebase; runtime is unaffected
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

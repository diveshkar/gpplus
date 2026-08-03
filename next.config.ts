import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next.js sees an
  // unrelated pnpm-lock.yaml in a parent folder and warns about an ambiguous
  // root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// Origins allowed to reach the dev server and invoke Server Actions. Next.js 16
// blocks cross-origin dev requests by default, which breaks access through a
// tunnel like ngrok (the phone cannot load the app's JS, so nothing becomes
// interactive). Wildcards cover ngrok's changing subdomains.
const tunnelOrigins = [
  "*.ngrok-free.app",
  "*.ngrok.app",
  "*.ngrok-free.dev",
  "*.ngrok.io",
];

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, Next.js sees an
  // unrelated pnpm-lock.yaml in a parent folder and warns about an ambiguous
  // root.
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: tunnelOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: tunnelOrigins,
      // Room for the uploaded logo (stored as a small data URL).
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;

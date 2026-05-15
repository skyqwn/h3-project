import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack root so it doesn't infer the workspace from a sibling
  // package's lockfile up the tree.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

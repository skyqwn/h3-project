import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Pin Turbopack root so it doesn't infer the workspace from a sibling
  // package's lockfile up the tree.
  turbopack: {
    root: process.cwd(),
  },
};

export default withNextIntl(nextConfig);

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      // 5 MB attachment + form fields + base64 overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default withNextIntl(nextConfig);

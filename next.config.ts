import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // 커버 이미지 업로드는 Vercel Blob(공개 버킷)에 저장된다. next/image가
    // 원격 호스트를 최적화하려면 호스트네임을 명시적으로 허용해야 한다.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // 5 MB attachment + form fields + base64 overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default withNextIntl(nextConfig);

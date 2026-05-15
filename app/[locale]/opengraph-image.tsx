import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

export const alt = "H3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: params.locale as Locale,
    namespace: "home.hero",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: 80,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            color: "#e60023",
            fontSize: 56,
            fontWeight: 800,
            letterSpacing: -1.6,
          }}
        >
          H3
        </div>
        <div
          style={{
            color: "#000000",
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: -1.2,
            maxWidth: 1000,
          }}
        >
          {t("headline")}
        </div>
        <div
          style={{
            color: "#62625b",
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          {t("eyebrow")}
        </div>
      </div>
    ),
    size
  );
}

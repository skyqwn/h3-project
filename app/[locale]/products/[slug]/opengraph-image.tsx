import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/mdx";
import type { Locale } from "@/i18n/routing";

export const alt = "H3 product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProductOgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  let title = "H3";
  let tagline = "";
  try {
    const product = await getProduct(params.slug, params.locale as Locale);
    title = product.title;
    tagline = product.tagline;
  } catch {
    // Fall back to brand-only template if the slug isn't resolvable.
  }

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
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: -1.0,
          }}
        >
          H3
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              color: "#62625b",
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            {tagline}
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
            {title}
          </div>
        </div>
        <div style={{ color: "#62625b", fontSize: 18 }}>
          h3 / products / {params.slug}
        </div>
      </div>
    ),
    size
  );
}

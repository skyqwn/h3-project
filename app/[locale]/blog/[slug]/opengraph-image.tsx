import { ImageResponse } from "next/og";
import { getPost } from "@/lib/posts";
import type { Locale } from "@/i18n/routing";

export const alt = "H3 blog post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PostOgImage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  let title = "H3";
  let category = "";
  try {
    const post = await getPost(params.slug, params.locale as Locale);
    title = post.title;
    category = post.category;
  } catch {
    // brand-only fallback
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
            {category}
          </div>
          <div
            style={{
              color: "#000000",
              fontSize: 72,
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
          h3 / blog / {params.slug}
        </div>
      </div>
    ),
    size
  );
}

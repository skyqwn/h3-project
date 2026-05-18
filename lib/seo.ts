import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";

// Resolve the canonical site origin without hardcoding it per environment.
// Priority:
//   1. NEXT_PUBLIC_SITE_URL — explicit override (use this for a custom
//      domain, e.g. https://h3.co.kr).
//   2. Vercel production: VERCEL_PROJECT_PRODUCTION_URL — the stable
//      production domain (h3-project.vercel.app), correct for canonical/OG.
//   3. Vercel preview: VERCEL_URL — the per-deployment preview URL.
//   4. Local dev fallback: http://localhost:3000.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

const SITE = resolveSiteUrl();
const BRAND = "H3";

// Build the URL pair for a locale-agnostic path. Korean lives at root,
// English at /en — flip the prefix based on the locale.
function urlsFor(path: string): { ko: string; en: string } {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return {
    ko: `${SITE}${cleanPath}`,
    en: `${SITE}/en${cleanPath === "/" ? "" : cleanPath}`,
  };
}

type PageMetaArgs = {
  locale: Locale;
  /** locale-agnostic path, e.g. "/products/sample" or "/" */
  path: string;
  title: string;
  description: string;
  /** absolute or root-relative image URL; defaults to the route's
   *  opengraph-image.tsx output when omitted */
  image?: string;
  /** robots index directives — defaults to index,follow */
  noindex?: boolean;
};

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noindex = false,
}: PageMetaArgs): Metadata {
  const urls = urlsFor(path);
  const ownUrl = locale === "ko" ? urls.ko : urls.en;
  const fullTitle = `${title} — ${BRAND}`;

  return {
    metadataBase: new URL(SITE),
    title: fullTitle,
    description,
    applicationName: BRAND,
    authors: [{ name: BRAND }],
    generator: "Next.js",
    keywords: [BRAND, "tech", "product"],
    referrer: "origin-when-cross-origin",
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      siteName: BRAND,
      title: fullTitle,
      description,
      url: ownUrl,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: ownUrl,
      languages: {
        "ko-KR": urls.ko,
        "en-US": urls.en,
        "x-default": urls.ko,
      },
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

// -------------------------------------------------------------------
// JSON-LD builders
// -------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND,
    url: SITE,
    logo: `${SITE}/icon.png`,
  };
}

export function websiteJsonLd(locale: Locale) {
  const inLanguage = locale === "ko" ? "ko-KR" : "en-US";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    url: SITE,
    inLanguage,
  };
}

export function productJsonLd(p: {
  title: string;
  tagline: string;
  slug: string;
  locale: Locale;
  image: string;
}) {
  const path = `/products/${p.slug}`;
  const url = p.locale === "ko" ? `${SITE}${path}` : `${SITE}/en${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.tagline,
    url,
    image: p.image.startsWith("http") ? p.image : `${SITE}${p.image}`,
    brand: { "@type": "Brand", name: BRAND },
  };
}

export function breadcrumbJsonLd(
  locale: Locale,
  trail: { name: string; path: string }[]
) {
  const prefix = locale === "ko" ? SITE : `${SITE}/en`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${prefix}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

export { SITE as SITE_URL, BRAND as BRAND_NAME };

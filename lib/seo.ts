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
  /** append " — H3" to the title (default). Set false when `title` already
   *  contains the brand (e.g. the home page's "H3 Tech | ..."). */
  appendBrand?: boolean;
  /** when present, og:type becomes "article" with publish/modify times */
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authors?: string[];
  };
};

export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noindex = false,
  appendBrand = true,
  article,
}: PageMetaArgs): Metadata {
  const urls = urlsFor(path);
  const ownUrl = locale === "ko" ? urls.ko : urls.en;
  const fullTitle = appendBrand ? `${title} — ${BRAND}` : title;
  // Default share image is the H3 logo card (public/og-default.png). Pages
  // that pass an explicit `image` (products, blog posts) override it. Without
  // this, scrapers (KakaoTalk, etc.) fall back to picking a random photo from
  // the page body.
  const ogImage = image ?? `${SITE}/og-default.png`;

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
      type: article ? "article" : "website",
      siteName: BRAND,
      title: fullTitle,
      description,
      url: ownUrl,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
      images: [{ url: ogImage, width: 1200, height: 630 }],
      ...(article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime ?? article.publishedTime,
            authors: article.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
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

// Canonical company facts pulled from the `footer.company` message catalog so
// the structured data never drifts from what the footer/location section shows.
// Region/country are stable, non-localized, so they live here as constants.
type CompanyInfo = {
  phone: string;
  email: string;
  /** full display address, e.g. "인천광역시 서구 이든1로 15 (22667)" */
  address: string;
  ceo?: string;
};

// Legal/searchable name and aliases for the Organization node. `BRAND` ("H3")
// stays the visible wordmark; the org's canonical name is the full "H3 Tech".
const ORG_NAME = "H3 Tech";
const ORG_ALTERNATE_NAMES = ["H3", "에이치쓰리", "에이치쓰리테크"];
const ORG_DESCRIPTION =
  "H3 Tech는 반도체 및 디스플레이 산업을 위한 자동화 설비, AI·AX 제어 시스템, 공장 자동화 시스템, 산업용 장비 및 엔지니어링 솔루션을 제공하는 기술 기업입니다.";
const ORG_KEYWORDS = [
  "반도체",
  "디스플레이",
  "자동화 설비",
  "공장 자동화",
  "AI 제어 시스템",
  "AX 제어 시스템",
  "산업용 장비",
  "표면처리 장비",
  "도금 장비",
  "엔지니어링",
  "반도체 장비",
  "H3 Tech",
  "에이치쓰리테크",
];

// "010-6777-6730" → "+82-10-6777-6730" (international form Google prefers,
// keeping human-readable hyphens).
function toIntlKR(phone: string): string {
  return phone.replace(/^0/, "+82-");
}

export function organizationJsonLd(company?: CompanyInfo) {
  const base = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    alternateName: ORG_ALTERNATE_NAMES,
    url: SITE,
    logo: `${SITE}/icon.png`,
    description: ORG_DESCRIPTION,
    keywords: ORG_KEYWORDS,
    sameAs: [SITE],
  };

  if (!company) return base;

  const telephone = toIntlKR(company.phone);
  // Split off the "(22667)" postal code if present.
  const postal = company.address.match(/\((\d{5})\)/)?.[1];
  const streetAddress = company.address.replace(/\s*\(\d{5}\)\s*$/, "").trim();

  return {
    ...base,
    email: company.email,
    telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality: "인천",
      addressRegion: "인천광역시",
      addressCountry: "KR",
      ...(postal ? { postalCode: postal } : {}),
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone,
      email: company.email,
      contactType: "sales",
      areaServed: "KR",
      availableLanguage: ["Korean", "English"],
    },
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

export function articleJsonLd(p: {
  title: string;
  summary: string;
  slug: string;
  locale: Locale;
  image: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
}) {
  const path = `/blog/${p.slug}`;
  const url = p.locale === "ko" ? `${SITE}${path}` : `${SITE}/en${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.summary,
    image: p.image.startsWith("http") ? p.image : `${SITE}${p.image}`,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt ?? p.publishedAt,
    author: { "@type": "Organization", name: p.author },
    publisher: { "@type": "Organization", name: BRAND },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

export { SITE as SITE_URL, BRAND as BRAND_NAME };

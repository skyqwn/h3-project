import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/layout/LenisProvider";
import { TopButton } from "@/components/layout/TopButton";
import { organizationJsonLd, websiteJsonLd, SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

// Pretendard Variable via CDN dynamic subset: the browser fetches only the
// glyph chunks a page actually uses (~100-300KB) instead of the full ~2MB
// font, with full Korean coverage. See app/globals.css --font-* stack.
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const feed =
    locale === "en" ? `${SITE_URL}/en/rss.xml` : `${SITE_URL}/rss.xml`;
  return {
    title: "H3",
    description: "H3 company intro site",
    alternates: {
      types: { "application/rss+xml": feed },
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  // Canonical (Korean) company facts for the Organization structured data —
  // keeps the KR address/phone stable for Google geocoding regardless of the
  // page locale.
  const company = await getTranslations({
    locale: "ko",
    namespace: "footer.company",
  });
  const organization = organizationJsonLd({
    phone: company("phone"),
    email: company("email"),
    address: company("address"),
    ceo: company("ceo"),
  });

  return (
    <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
      </head>
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd(locale as Locale)),
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <LenisProvider>
            <Header />
            <main className="pt-16">{children}</main>
            <Footer />
            <TopButton />
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/layout/LenisProvider";
import { TopButton } from "@/components/layout/TopButton";
import { organizationJsonLd, websiteJsonLd, SITE_URL } from "@/lib/seo";
import type { Metadata } from "next";

// Pretendard Variable — unified KO + Latin web font, self-hosted so Korean
// (the default locale) renders consistently across devices instead of a
// system fallback. Variable weight axis 45–920.
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pin-sans",
});

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

  return (
    <html
      lang={locale}
      className={`${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
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

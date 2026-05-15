import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { routing, type Locale } from "@/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/layout/LenisProvider";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-pin-sans",
});

export const metadata: Metadata = {
  title: "H3",
  description: "H3 company intro site",
};

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
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <LenisProvider>
            <Header />
            <div className="pt-16">{children}</div>
            <Footer />
          </LenisProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

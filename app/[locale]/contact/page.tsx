import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ContactForm } from "@/components/ui/ContactForm";
import { env } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/contact",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="min-h-screen bg-canvas py-section">
      <div className="max-w-form mx-auto px-6 space-y-12">
        <div>
          <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
            {t("subtitle")}
          </p>
          <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        </div>
        <ContactForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      </div>
    </div>
  );
}

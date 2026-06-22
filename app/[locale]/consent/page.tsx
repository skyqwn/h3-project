import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { LegalDocView } from "@/components/sections/LegalDocView";
import { LEGAL_DOCS } from "@/lib/legal";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.consent" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/consent",
    title: t("title"),
    description: t("title"),
  });
}

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <PageShell eyebrow={t("consent.eyebrow")} title={t("consent.title")}>
      <LegalDocView
        doc={LEGAL_DOCS.consent}
        effectiveDateLabel={t("effectiveDate")}
      />
    </PageShell>
  );
}

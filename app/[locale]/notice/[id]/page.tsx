import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { NoticeDetailView } from "@/components/sections/NoticeDetailView";
import { NOTICES, getNotice } from "@/lib/notices";
import { routing, type Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "notice" });
  const notice = getNotice(Number(id));
  if (!notice) {
    return pageMetadata({
      locale: locale as Locale,
      path: `/notice/${id}`,
      title: t("title"),
      description: t("title"),
      noindex: true,
    });
  }
  return pageMetadata({
    locale: locale as Locale,
    path: `/notice/${notice.id}`,
    title: notice.title,
    description: notice.title,
  });
}

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    NOTICES.map((n) => ({ locale, id: String(n.id) })),
  );
}

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notice");

  const notice = getNotice(Number(id));
  if (!notice) notFound();

  return (
    <PageShell eyebrow={t("eyebrow")} title={notice.title}>
      <NoticeDetailView
        notice={notice}
        labels={{
          dateLabel: t("columns.date"),
          attachmentLabel: t("attachmentLabel"),
          back: t("back"),
        }}
      />
    </PageShell>
  );
}

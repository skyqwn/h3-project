import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageShell } from "@/components/layout/PageShell";
import { NoticeList } from "@/components/sections/NoticeList";
import { getNotices } from "@/lib/notices";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notice" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/notice",
    title: t("title"),
    description: t("intro"),
  });
}

export default async function NoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notice");

  return (
    <PageShell eyebrow={t("eyebrow")} title={t("title")}>
      <NoticeList
        notices={getNotices()}
        labels={{
          intro: t("intro"),
          colNumber: t("columns.number"),
          colTitle: t("columns.title"),
          colDate: t("columns.date"),
          colAttachment: t("columns.attachment"),
          attachmentBadge: t("attachmentBadge"),
          empty: t("empty"),
        }}
      />
    </PageShell>
  );
}

import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";
import { pageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

const ITEMS = ["may", "june", "july", "august"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.history" });
  return pageMetadata({
    locale: locale as Locale,
    path: "/about/history",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about.history");

  return (
    <PageShell eyebrow={t("subtitle")} title={t("title")}>
      <div className="grid items-start gap-12 lg:grid-cols-[0.64fr_0.36fr] lg:gap-16">
        <div>
          <ScrollReveal>
            <p className="max-w-5xl break-keep text-heading-md leading-relaxed text-ink md:text-[24px] md:leading-[1.55]">
              {t("lead")}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <section className="mt-16 grid gap-8 md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr]">
              <h2 className="text-[64px] font-extrabold leading-none tracking-0 text-ink md:text-[72px]">
                2026
              </h2>

              <ol className="relative grid gap-8">
                <span
                  className="absolute left-[94px] top-3 hidden h-[calc(100%-24px)] w-px bg-hairline md:block"
                  aria-hidden
                />
                {ITEMS.map((key) => (
                  <li
                    key={key}
                    className="relative grid items-center gap-2 md:grid-cols-[64px_40px_1fr] md:gap-4"
                  >
                    <span className="text-[28px] font-bold leading-none tabular-nums text-ink md:text-right md:text-[30px]">
                      {t(`items.${key}.month`)}
                    </span>
                    <span className="relative hidden h-full items-center justify-center md:flex" aria-hidden>
                      <span className="size-3 rounded-full bg-primary ring-4 ring-white" />
                    </span>
                    <p className="break-keep text-[24px] font-bold leading-relaxed text-body md:text-[28px]">
                      {t(`items.${key}.body`)}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.12} className="lg:pt-8">
          <div className="relative overflow-hidden rounded-md bg-surface-card shadow-sm">
            <div className="relative aspect-[4/3]">
              <Image
                src="/feature-fabrication.jpg"
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </PageShell>
  );
}

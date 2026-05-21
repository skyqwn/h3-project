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
  const c = await getTranslations("footer.company");
  const tel = c("phone").replace(/[^0-9+]/g, "");
  const steps = [t("aside.step1"), t("aside.step2"), t("aside.step3")];

  return (
    <div className="min-h-screen bg-surface-soft py-section">
      <div className="max-w-reading mx-auto px-6">
        <div className="max-w-narrow">
          <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
            {t("subtitle")}
          </p>
          <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,36rem)_18rem] lg:gap-16">
          {/* Form panel — flat bordered surface (no shadow; DESIGN reserves
              elevation for the modal layer). */}
          <div className="rounded-lg border border-hairline bg-surface-elevated p-6 sm:p-8">
            <ContactForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          </div>

          {/* Reassurance aside — answers "when will they reply, can I just
              call, what happens next" at the moment of commitment. */}
          <aside className="space-y-8">
            <div>
              <p className="text-caption-md uppercase tracking-wider text-mute mb-2">
                {t("aside.responseTitle")}
              </p>
              <p className="text-body-md text-ink">{t("aside.responseBody")}</p>
            </div>

            <div className="border-t border-hairline pt-6">
              <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
                {t("aside.directTitle")}
              </p>
              <ul className="space-y-2 text-body-md">
                <li>
                  <a
                    href={`tel:${tel}`}
                    className="text-ink transition-colors hover:text-primary"
                  >
                    {c("phone")}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${c("email")}`}
                    className="text-ink transition-colors hover:text-primary"
                  >
                    {c("email")}
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t border-hairline pt-6">
              <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
                {t("aside.processTitle")}
              </p>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 text-caption-md tabular-nums text-ash">
                      {`0${i + 1}`}
                    </span>
                    <span className="text-body-sm text-body leading-relaxed">
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-hairline pt-6">
              <p className="text-caption-md uppercase tracking-wider text-mute mb-1">
                {t("aside.hoursLabel")}
              </p>
              <p className="text-body-sm text-body">{t("aside.hours")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
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
  // Icon + label + value contact rows, shared by the mobile strip and the
  // desktop sidebar so both render identically.
  const contacts = [
    { Icon: Phone, label: c("phoneLabel"), value: c("phone"), href: `tel:${tel}` },
    {
      Icon: Mail,
      label: c("emailLabel"),
      value: c("email"),
      href: `mailto:${c("email")}`,
    },
  ];

  return (
    <PageShell eyebrow={t("subtitle")} title={t("title")}>
      {/* Mobile-only: process steps + tap-to-call above the form.
          Desktop uses the full sidebar instead. */}
      <div className="mb-8 lg:hidden">
        <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
          {t("aside.processTitle")}
        </p>
        <ol className="space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 text-caption-md tabular-nums text-ash">
                {`0${i + 1}`}
              </span>
              <span className="text-body-sm text-body leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 space-y-2">
          {contacts.map(({ Icon, label, value, href }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2 text-body-sm text-ink transition-colors hover:text-primary"
            >
              <Icon aria-hidden className="size-4 shrink-0 text-mute" />
              <span className="text-mute">{label}</span>
              <span>{value}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,36rem)_1fr] lg:gap-16">
          {/* Form panel — flat bordered surface (no shadow; DESIGN reserves
              elevation for the modal layer). */}
          <div className="rounded-lg border border-hairline bg-surface-elevated p-6 sm:p-8">
            <ContactForm turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          </div>

          {/* Reassurance sidebar (desktop). Mobile gets the compact strip
              above instead. */}
          <aside className="hidden space-y-8 lg:block">
            <div>
              <p className="text-caption-md uppercase tracking-wider text-mute mb-2">
                {t("aside.responseTitle")}
              </p>
              <p className="text-body-sm text-body">{t("aside.responseBody")}</p>
            </div>

            <div className="border-t border-hairline pt-6">
              <p className="text-caption-md uppercase tracking-wider text-mute mb-3">
                {t("aside.directTitle")}
              </p>
              <div className="space-y-2">
                {contacts.map(({ Icon, label, value, href }) => (
                  <a
                    key={href}
                    href={href}
                    className="flex items-center gap-2 text-body-sm text-ink transition-colors hover:text-primary"
                  >
                    <Icon aria-hidden className="size-4 shrink-0 text-mute" />
                    <span className="text-mute">{label}</span>
                    <span>{value}</span>
                  </a>
                ))}
              </div>
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
    </PageShell>
  );
}

import { getTranslations } from "next-intl/server";

// Korean street address for an accurate Google geocode regardless of UI
// locale. Keyless embed — no API key required.
const MAP_QUERY = "인천광역시 서구 이든1로 15";

export async function LocationSection() {
  const t = await getTranslations("about.location");
  const c = await getTranslations("footer.company");
  const q = encodeURIComponent(MAP_QUERY);
  const embedSrc = `https://www.google.com/maps?q=${q}&z=16&output=embed`;
  const largeHref = `https://www.google.com/maps?q=${q}`;

  return (
    <section className="border-t border-hairline bg-canvas py-section">
      <div className="max-w-page mx-auto px-6">
        <h2 className="text-heading-xl text-ink mb-8">{t("title")}</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-[16/10] overflow-hidden rounded-md border border-hairline">
            <iframe
              src={embedSrc}
              title={t("title")}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <dl className="space-y-3 text-body-md">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-mute">{c("addressLabel")}</dt>
              <dd className="text-body">{c("address")}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-mute">{c("ceoLabel")}</dt>
              <dd className="text-body">{c("ceo")}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-mute">{c("phoneLabel")}</dt>
              <dd>
                <a
                  href={`tel:${c("phone").replace(/[^0-9+]/g, "")}`}
                  className="text-body hover:text-primary"
                >
                  {c("phone")}
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-mute">{c("emailLabel")}</dt>
              <dd>
                <a
                  href={`mailto:${c("email")}`}
                  className="text-body hover:text-primary"
                >
                  {c("email")}
                </a>
              </dd>
            </div>
            <a
              href={largeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-body-sm text-primary underline underline-offset-2 hover:text-primary-pressed"
            >
              {t("viewLarger")}
            </a>
          </dl>
        </div>
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

export async function AboutLocationTeaser() {
  const t = await getTranslations("about.location");
  const c = await getTranslations("footer.company");

  return (
    <section className="border-t border-hairline bg-canvas py-section">
      <div className="flex w-full flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-[120px]">
        <div>
          <h2 className="text-heading-lg text-ink">{t("title")}</h2>
          <p className="mt-1 text-body-md text-body">{c("address")}</p>
        </div>
        <Button href="/about/location" variant="secondary" size="md" arrow>
          {t("cta")}
        </Button>
      </div>
    </section>
  );
}

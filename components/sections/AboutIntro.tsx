import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

export async function AboutIntro() {
  const t = await getTranslations("about.intro");

  return (
    <section className="border-b border-hairline bg-canvas px-6 py-12 lg:px-[120px] lg:py-16">
      <p className="text-caption-md text-mute">{t("eyebrow")}</p>
      <h1 className="mt-3 text-[40px] font-bold leading-tight text-ink">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-4xl text-[24px] font-semibold leading-snug text-ink">
        {t("subtitle")}
      </p>
      <p className="mt-5 max-w-3xl text-body-md leading-relaxed text-body">
        {t("body")}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button href="/contact" size="lg" arrow>{t("contact")}</Button>
        <Button href="/about#ax-development" variant="secondary" size="lg" arrow>
          {t("development")}
        </Button>
      </div>
    </section>
  );
}

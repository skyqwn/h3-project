import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home.hero");

  return (
    <main className="min-h-screen bg-canvas p-16">
      <p className="text-caption-md uppercase tracking-wider text-mute mb-4">
        {t("eyebrow")}
      </p>
      <h1 className="text-display-xl text-primary mb-8">{t("headline")}</h1>
      <button className="bg-primary text-on-primary rounded-md h-10 px-4 text-button-md">
        {t("cta")}
      </button>
    </main>
  );
}

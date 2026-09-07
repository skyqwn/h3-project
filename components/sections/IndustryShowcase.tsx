import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { IndustryVisual } from "@/components/three/IndustryVisual";
import styles from "./IndustryShowcase.module.css";

export async function IndustryShowcase() {
  const t = await getTranslations("home.industries");

  return (
    <section id="industries" aria-label={t("label")} className={styles.section}>
      <div className={styles.panels}>
        {(["semiconductor", "battery"] as const).map((kind) => (
          <article key={kind} className={`${styles.panel} ${styles[kind]}`} aria-labelledby={`${kind}-title`}>
            <div className={styles.copy}>
              <p className={styles.eyebrow}>{t(`${kind}.eyebrow`)}</p>
              <h2 id={`${kind}-title`} className={styles.title}>{t(`${kind}.title`)}</h2>
              <p className={styles.tagline}>{t(`${kind}.tagline`)}</p>
              <p className={styles.body}>{t(`${kind}.body`)}</p>
              <Link href="/contact" className={styles.link}>
                {t("cta")}
                <ArrowRight aria-hidden className="size-[18px]" />
              </Link>
            </div>
            <div className={styles.visual}>
              <IndustryVisual kind={kind} label={t(`${kind}.imageAlt`)} />
            </div>
          </article>
        ))}
      </div>
      <p className={styles.note}>{t("note")}</p>
    </section>
  );
}

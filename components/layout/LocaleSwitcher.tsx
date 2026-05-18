"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className="flex items-center gap-2 text-button-sm"
      aria-busy={isPending}
    >
      <button
        type="button"
        onClick={() => switchTo("ko")}
        className={`cursor-pointer ${
          locale === "ko" ? "font-bold text-ink" : "text-mute"
        }`}
        aria-current={locale === "ko" ? "true" : undefined}
      >
        KO
      </button>
      <span className="text-stone">/</span>
      <button
        type="button"
        onClick={() => switchTo("en")}
        className={`cursor-pointer ${
          locale === "en" ? "font-bold text-ink" : "text-mute"
        }`}
        aria-current={locale === "en" ? "true" : undefined}
      >
        EN
      </button>
    </div>
  );
}

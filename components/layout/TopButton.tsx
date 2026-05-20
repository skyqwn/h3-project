"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { getLenis } from "./LenisProvider";

export function TopButton() {
  const t = useTranslations("common");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t("toTop")}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full border border-hairline bg-surface-elevated text-ink shadow-md transition-all hover:border-primary hover:text-primary cursor-pointer",
        show
          ? "opacity-100 translate-y-0"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
    >
      <ChevronUp aria-hidden className="size-5" />
    </button>
  );
}

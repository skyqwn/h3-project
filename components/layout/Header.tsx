"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/about", key: "about" },
  { href: "/products", key: "products" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 bg-canvas border-b transition-shadow",
        scrolled ? "border-hairline shadow-sm" : "border-transparent"
      )}
    >
      {/* SEO h1 — brand name as the primary semantic heading on every page.
          Visually hidden so the visible wordmark below stays the only mark
          users see. */}
      <h1 className="sr-only">H3</h1>

      <div className="max-w-page mx-auto h-full px-6 flex items-center justify-between gap-6">
        {/* Brand wordmark — clickable home link with accessible label. */}
        <Link
          href="/"
          aria-label="Home"
          className="text-heading-xl text-primary font-bold leading-none"
        >
          <span aria-hidden="true" className="text-2xl">
            H3
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-body-strong">
          {NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "transition-colors hover:text-primary",
                isActive(href) ? "text-primary" : "text-ink"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Desktop: locale switcher + CTA */}
        <div className="hidden md:flex items-center gap-4">
          <LocaleSwitcher />
          <Button href="/contact" variant="primary" size="md">
            {t("cta")}
          </Button>
        </div>

        {/* Mobile: locale switcher to the left of the hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <LocaleSwitcher />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

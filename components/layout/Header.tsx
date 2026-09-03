"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/about",
    key: "about",
    children: [
      { href: "/about", key: "overview" },
      { href: "/about/history", key: "history" },
    ],
  },
  {
    href: "/products",
    key: "products",
    children: [
      { href: "/products", key: "lineup" },
      { href: "/products", key: "equipment" },
      { href: "/contact", key: "automation" },
    ],
  },
  {
    href: "/blog",
    key: "blog",
    children: [
      { href: "/blog", key: "articles" },
      { href: "/notice", key: "notice" },
    ],
  },
] as const;

type NavKey = (typeof NAV)[number]["key"];

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<NavKey | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));
  const activeNav = NAV.find((item) => item.key === activeMenu);

  return (
    <header
      onMouseLeave={() => setActiveMenu(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setActiveMenu(null);
        }
      }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-20 border-b bg-white/95 backdrop-blur-md transition-[border-color,box-shadow]",
        scrolled ? "border-hairline shadow-sm" : "border-hairline-soft"
      )}
    >
      {/* SEO h1 — brand name as the primary semantic heading on every page.
          Visually hidden so the visible wordmark below stays the only mark
          users see. */}
      <h1 className="sr-only">H3</h1>

      <div className="flex h-full w-full items-center justify-between gap-6 px-6 lg:px-[120px]">
        {/* Brand wordmark — clickable home link with accessible label. */}
        <Link
          href="/"
          aria-label={t("home")}
          className="flex h-14 w-32 shrink-0 items-center justify-start lg:w-52"
        >
          <Image
            src="/logo-full.png"
            alt=""
            width={152}
            height={92}
            priority
            className="h-14 w-32 object-contain object-left lg:w-40"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-12 text-[17px] font-semibold tracking-0 text-ink lg:flex xl:gap-20">
          {NAV.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => setActiveMenu(key)}
              onFocus={() => setActiveMenu(key)}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "relative flex h-20 items-center whitespace-nowrap transition-colors hover:text-primary",
                isActive(href) || activeMenu === key ? "text-primary" : "text-ink",
                "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100",
                (isActive(href) || activeMenu === key) && "after:scale-x-100"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="hidden w-52 items-center justify-end lg:flex">
          <LocaleSwitcher />
        </div>

        {/* Mobile: locale switcher to the left of the hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <LocaleSwitcher />
          <MobileMenu />
        </div>
      </div>

      <div
        className={cn(
          "absolute left-0 top-full hidden w-full border-b border-hairline bg-white shadow-sm transition-[opacity,visibility,transform] duration-200 lg:block",
          activeNav
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        )}
        onMouseEnter={() => {
          if (activeNav) setActiveMenu(activeNav.key);
        }}
      >
        <nav className="flex min-h-36 items-center justify-center gap-20 px-[120px] text-[17px] font-bold text-ink">
          {activeNav?.children.map((item) => (
            <Link
              key={`${activeNav.key}-${item.key}`}
              href={item.href}
              className="whitespace-nowrap py-8 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-outer"
            >
              {t(`mega.${activeNav.key}.${item.key}`)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

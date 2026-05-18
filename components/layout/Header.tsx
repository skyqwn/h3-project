import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileMenu } from "./MobileMenu";
import { Button } from "@/components/ui/Button";

export async function Header() {
  const t = await getTranslations("nav");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-canvas border-b border-hairline">
      {/* SEO h1 — brand name as the primary semantic heading on every page.
          Visually hidden so the visible wordmark below stays the only mark
          users see. */}
      <h1 className="sr-only">H3</h1>

      <div className="max-w-page mx-auto h-full px-6 flex items-center justify-between gap-6">
        {/* Brand wordmark — clickable home link with accessible label. The
            inner span is aria-hidden so screen readers announce just "Home"
            instead of repeating the H3 already read from the sr-only h1. */}
        <Link
          href="/"
          aria-label="Home"
          className="text-heading-xl text-primary font-bold leading-none"
        >
          <span aria-hidden="true" className="text-2xl">H3</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-body-strong text-ink">
          <Link href="/about" className="hover:text-ink-soft transition-colors">
            {t("about")}
          </Link>
          <Link href="/products" className="hover:text-ink-soft transition-colors">
            {t("products")}
          </Link>
          <Link href="/blog" className="hover:text-ink-soft transition-colors">
            {t("blog")}
          </Link>
          <Link href="/contact" className="hover:text-ink-soft transition-colors">
            {t("contact")}
          </Link>
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

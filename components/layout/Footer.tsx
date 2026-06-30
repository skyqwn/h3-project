import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

const NAV = [
  { href: "/about", key: "about" },
  { href: "/products", key: "products" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

const LEGAL = [
  { href: "/terms", key: "terms" },
  { href: "/privacy", key: "privacy" },
  { href: "/consent", key: "consent" },
  { href: "/notice", key: "notice" },
] as const;

export async function Footer() {
  const nav = await getTranslations("nav");
  const foot = await getTranslations("footer");

  const phoneDigits = foot("company.phone").replace(/[^0-9+]/g, "");
  const rows = [
    { label: foot("company.ceoLabel"), value: foot("company.ceo") },
    {
      label: foot("company.phoneLabel"),
      value: foot("company.phone"),
      href: `tel:${phoneDigits}`,
    },
    {
      label: foot("company.emailLabel"),
      value: foot("company.email"),
      href: `mailto:${foot("company.email")}`,
    },
    { label: foot("company.addressLabel"), value: foot("company.address") },
    { label: foot("company.hoursLabel"), value: foot("company.hours") },
  ];

  return (
    <footer className="bg-canvas border-t border-hairline text-body-sm text-mute">
      <div className="mx-auto max-w-page px-6 py-16">
        {/* Aligns to the site container (max-w-page) like the header; a
            12-col track fills the full width. Below lg: brand on top, then
            explore (content-width) + company (fills the rest) so the long
            values stay on one line instead of cramping in a half column. */}
        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-10 lg:grid-cols-12 lg:gap-y-12">
          {/* Brand anchor — hidden on mobile (the copyright keeps the mark);
              shown as the left anchor on desktop. */}
          <div className="hidden lg:col-span-5 lg:block">
            <Link
              href="/"
              aria-label="Home"
              className="inline-block text-heading-xl font-bold leading-none text-primary"
            >
              H3
            </Link>
            <p className="mt-4 text-body-md text-body">{foot("tagline")}</p>
          </div>

          <nav aria-label={foot("exploreLabel")} className="lg:col-span-3">
            <h2 className="mb-3 text-body-sm font-bold text-ink">
              {foot("exploreLabel")}
            </h2>
            <ul className="flex flex-col gap-2">
              {NAV.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-block whitespace-nowrap py-0.5 transition-colors hover:text-ink"
                  >
                    {nav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

            <div className="lg:col-span-4">
              <h2 className="mb-3 text-body-sm font-bold text-ink">
                {foot("company.heading")}
              </h2>
              <dl className="space-y-1.5">
                {rows.map((r) => (
                  <div key={r.label} className="flex gap-3">
                    <dt className="w-16 shrink-0 whitespace-nowrap text-mute">
                      {r.label}
                    </dt>
                    <dd className="text-body">
                      {r.href ? (
                        <a
                          href={r.href}
                          className="inline-block py-0.5 transition-colors hover:text-ink"
                        >
                          {r.value}
                        </a>
                      ) : (
                        r.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption-md text-mute">{foot("copyright")}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-caption-md">
            {LEGAL.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-mute transition-colors hover:text-ink"
                >
                  {foot(`legal.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

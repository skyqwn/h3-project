import Image from "next/image";
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
    { label: foot("company.faxLabel"), value: foot("company.fax") },
    {
      label: foot("company.emailLabel"),
      value: foot("company.email"),
      href: `mailto:${foot("company.email")}`,
    },
    { label: foot("company.addressLabel"), value: foot("company.address") },
    { label: foot("company.hoursLabel"), value: foot("company.hours") },
  ];

  return (
    <footer className="border-t border-hairline/70 bg-white/58 text-body-sm text-body">
      <div className="w-full px-6 py-14 md:py-16 lg:px-[120px]">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link
              href="/"
              aria-label={nav("home")}
              className="inline-flex"
            >
              <Image
                src="/logo-full.png"
                alt=""
                width={152}
                height={92}
                className="h-[54px] w-[90px] object-contain object-left"
              />
            </Link>
            <p className="mt-5 max-w-sm text-body-md font-semibold text-ink">
              {foot("tagline")}
            </p>
          </div>

          <nav aria-label={foot("exploreLabel")} className="lg:col-span-2">
            <h2 className="mb-4 text-caption-md font-bold uppercase text-ink">
              {foot("exploreLabel")}
            </h2>
            <ul className="flex flex-col gap-2">
              {NAV.map(({ href, key }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-block whitespace-nowrap py-0.5 transition-colors hover:text-primary"
                  >
                    {nav(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-5">
            <h2 className="mb-4 text-caption-md font-bold uppercase text-ink">
              {foot("company.heading")}
            </h2>
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {rows.map((r) => (
                <div key={r.label} className="flex gap-3">
                  <dt className="w-16 shrink-0 whitespace-nowrap text-mute">
                    {r.label}
                  </dt>
                  <dd className="text-body">
                    {r.href ? (
                      <a
                        href={r.href}
                        className="inline-block py-0.5 transition-colors hover:text-primary"
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

        <div className="mt-12 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption-md text-mute">{foot("copyright")}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-caption-md text-mute">
            {LEGAL.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="transition-colors hover:text-primary"
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

import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const nav = await getTranslations("nav");
  const foot = await getTranslations("footer");

  const phoneDigits = foot("company.phone").replace(/[^0-9+]/g, "");

  return (
    <footer className="bg-canvas border-t border-hairline text-body-sm text-mute">
      <div className="max-w-page mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand + nav */}
          <div>
            <h2 className="text-heading-md font-bold text-primary mb-3">H3</h2>
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                className="hover:text-ink-soft transition-colors"
              >
                {nav("about")}
              </Link>
              <Link
                href="/products"
                className="hover:text-ink-soft transition-colors"
              >
                {nav("products")}
              </Link>
              <Link
                href="/contact"
                className="hover:text-ink-soft transition-colors"
              >
                {nav("contact")}
              </Link>
            </nav>
          </div>

          {/* Company info */}
          <div className="col-span-2">
            <h2 className="text-body-sm font-bold text-ink mb-3">
              {foot("company.heading")}
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
              <dt className="text-mute">{foot("company.ceoLabel")}</dt>
              <dd className="text-body">{foot("company.ceo")}</dd>

              <dt className="text-mute">{foot("company.phoneLabel")}</dt>
              <dd className="text-body">
                <a
                  href={`tel:${phoneDigits}`}
                  className="hover:text-ink-soft transition-colors"
                >
                  {foot("company.phone")}
                </a>
              </dd>

              <dt className="text-mute">{foot("company.emailLabel")}</dt>
              <dd className="text-body">
                <a
                  href={`mailto:${foot("company.email")}`}
                  className="hover:text-ink-soft transition-colors"
                >
                  {foot("company.email")}
                </a>
              </dd>

              <dt className="text-mute">{foot("company.addressLabel")}</dt>
              <dd className="text-body">{foot("company.address")}</dd>
            </dl>
          </div>

          {/* Spacer / future column */}
          <div className="hidden md:block" />
        </div>

        <div className="mt-12 pt-6 border-t border-hairline-soft">
          <p className="text-body-sm">{foot("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}

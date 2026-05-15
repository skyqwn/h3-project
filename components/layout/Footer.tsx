import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const nav = await getTranslations("nav");
  const foot = await getTranslations("footer");

  return (
    <footer className="bg-canvas border-t border-hairline text-body-sm text-mute">
      <div className="max-w-page mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-body-sm font-bold text-ink mb-3">H3</h2>
          <p className="text-body-sm">{foot("copyright")}</p>
        </div>
        <div>
          <h2 className="text-body-sm font-bold text-ink mb-3">{nav("about")}</h2>
          <Link href="/about" className="block hover:text-ink-soft transition-colors">
            {nav("about")}
          </Link>
        </div>
        <div>
          <h2 className="text-body-sm font-bold text-ink mb-3">{nav("products")}</h2>
          <Link href="/products" className="block hover:text-ink-soft transition-colors">
            {nav("products")}
          </Link>
        </div>
        <div>
          <h2 className="text-body-sm font-bold text-ink mb-3">{nav("contact")}</h2>
          <Link href="/contact" className="block hover:text-ink-soft transition-colors">
            {nav("contact")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

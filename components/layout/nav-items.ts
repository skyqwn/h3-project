export const NAV = [
  {
    href: "/about",
    key: "about",
    children: [
      { href: "/about", key: "overview" },
      { href: "/about/history", key: "history" },
      { href: "/about/location", key: "location" },
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
      { href: "/news", key: "news" },
      { href: "/notice", key: "notice" },
    ],
  },
  {
    href: "/contact",
    key: "contact",
    // No `children` → renders as a plain top-level link with no mega-menu
    // panel (see Header.tsx) and a plain accordion row on mobile.
    children: [],
  },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

/** Mobile overlay shares the same items as the desktop nav. */
export const MOBILE_NAV = NAV;

export type MobileNavKey = NavKey;

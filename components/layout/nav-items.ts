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
] as const;

export type NavKey = (typeof NAV)[number]["key"];

/** Mobile overlay only: adds the standalone "contact" row (no desktop top
 *  nav / mega-menu entry exists for it — see Header.tsx). No `children`,
 *  so the accordion renders it as a plain link. */
export const MOBILE_NAV = [
  ...NAV,
  { href: "/contact", key: "contact", children: [] },
] as const;

export type MobileNavKey = (typeof MOBILE_NAV)[number]["key"];

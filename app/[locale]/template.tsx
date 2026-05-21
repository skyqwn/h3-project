import type { ReactNode } from "react";

// template.tsx (NOT layout.tsx) remounts on every navigation, so the
// fade-up animation replays on each route change — a shared, global page
// transition for all pages under [locale]. Honors prefers-reduced-motion
// via the global reset in app/globals.css.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-page-enter">{children}</div>;
}

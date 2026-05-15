import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip static assets, API routes, and Next.js internals.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

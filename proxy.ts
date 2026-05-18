// Next.js 16 renamed the "middleware" file convention to "proxy".
// next-intl still ships its handler from the next-intl/middleware
// subpath; the request/response signature is identical, so it works
// unchanged as the default proxy export.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip static assets, API routes, and Next.js internals.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

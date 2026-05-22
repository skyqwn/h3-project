"use client";

import { useEffect } from "react";

// global-error replaces the root layout entirely, so it must render its
// own <html>/<body> and cannot use next-intl (it lives outside the locale
// provider). Copy is hardcoded in Korean (the default locale); the font is
// loaded directly here since the locale layout's <head> is bypassed.
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href={PRETENDARD_CSS} />
      </head>
      <body className="min-h-screen bg-canvas flex items-center justify-center p-8">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-display-lg text-ink">문제가 발생했습니다</h1>
          <p className="text-body-md text-body leading-relaxed">
            일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.
            문제가 계속되면 문의해 주시면 빠르게 도와드리겠습니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={reset}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md bg-primary px-5 text-button-md text-on-primary transition-colors hover:bg-primary-pressed"
            >
              다시 시도
            </button>
            {/* Full-page nav on purpose: a root crash should reset all state,
                so a plain <a> is correct here, not next/link. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="text-body-strong text-ink underline-offset-2 transition-colors hover:text-primary"
            >
              홈으로
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}

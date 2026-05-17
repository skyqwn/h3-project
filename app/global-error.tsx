"use client";

import { useEffect } from "react";

// global-error replaces the root layout entirely, so it must render its
// own <html>/<body>. Our real html/body live in [locale]/layout.tsx,
// which a thrown root error would bypass — hence global-error, not
// a segment-level error.tsx.
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
      <body className="min-h-screen bg-canvas flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <h1 className="text-display-lg text-ink">Something went wrong</h1>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center bg-primary text-on-primary rounded-md h-10 px-4 text-button-md hover:bg-primary-pressed transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

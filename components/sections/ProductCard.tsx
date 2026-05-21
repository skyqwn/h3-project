"use client";

import { useState } from "react";
import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";

export type ProductTeaser = {
  slug: string;
  title: string;
  tagline: string;
  hero_image: string;
};

export function ProductCard({ product }: { product: ProductTeaser }) {
  // Degrade gracefully: a missing/404 hero image becomes an intentional
  // placeholder tile (warm surface + muted icon), never a broken-image glyph.
  const [failed, setFailed] = useState(false);

  return (
    <ScrollReveal>
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-card">
          {failed ? (
            <div className="flex h-full w-full items-center justify-center text-stone">
              <ImageIcon aria-hidden className="size-8" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.hero_image}
              alt=""
              loading="lazy"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          )}

          {/* Pinterest-style hover affordance: a faint veil for depth and a
              white arrow pill that rises in. Deliberately not red — primary
              stays reserved for true CTAs. */}
          <div className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
          <span className="pointer-events-none absolute bottom-3 right-3 flex size-9 translate-y-1 items-center justify-center rounded-full bg-canvas text-ink opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight aria-hidden className="size-4" />
          </span>
        </div>

        <h3 className="mt-4 text-heading-md text-ink">{product.title}</h3>
        <p className="text-body-sm text-mute">{product.tagline}</p>
      </Link>
    </ScrollReveal>
  );
}

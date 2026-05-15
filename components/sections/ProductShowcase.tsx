import { Link } from "@/i18n/routing";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { ScrollReveal } from "@/components/primitives/ScrollReveal";

export type ProductTeaser = {
  slug: string;
  title: string;
  tagline: string;
  hero_image: string;
};

type Props = {
  title: string;
  products: ProductTeaser[];
};

export function ProductShowcase({ title, products }: Props) {
  return (
    <section className="py-section bg-canvas">
      <div className="max-w-page mx-auto px-6">
        <DisplayHeading as="h2" level="heading-xl" className="mb-8">
          {title}
        </DisplayHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {products.map((p) => (
            <ScrollReveal key={p.slug}>
              <Link href={`/products/${p.slug}`} className="block group">
                <div
                  className="aspect-[4/5] rounded-md bg-surface-card bg-cover bg-center overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(135deg, #f6f6f3 0%, #dadad3 100%), url(${p.hero_image})`,
                  }}
                  aria-hidden
                />
                <h3 className="text-heading-md mt-3 text-ink">{p.title}</h3>
                <p className="text-body-sm text-mute">{p.tagline}</p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

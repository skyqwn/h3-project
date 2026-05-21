import { SectionHeader } from "@/components/primitives/SectionHeader";
import { ProductCard, type ProductTeaser } from "./ProductCard";

export type { ProductTeaser };

type Props = {
  eyebrow: string;
  title: string;
  products: ProductTeaser[];
};

export function ProductShowcase({ eyebrow, title, products }: Props) {
  return (
    <section className="py-section bg-canvas">
      <div className="max-w-page mx-auto px-6">
        <SectionHeader index="03" eyebrow={eyebrow} title={title} />
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

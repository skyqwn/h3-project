import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Section } from "@/components/layout/Section";
import { ProductCard, type ProductTeaser } from "./ProductCard";

export type { ProductTeaser };

type Props = {
  eyebrow: string;
  title: string;
  products: ProductTeaser[];
};

export function ProductShowcase({ eyebrow, title, products }: Props) {
  return (
    <Section tone="canvas">
      <SectionHeader index="03" eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </Section>
  );
}

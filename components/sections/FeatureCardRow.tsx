import { ScrollReveal } from "@/components/primitives/ScrollReveal";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { Button } from "@/components/ui/Button";

export type FeatureItem = {
  title: string;
  body: string;
  cta: { label: string; href: string };
  image: string;
  /** Flip image and copy to the opposite columns (useful for alternating rows) */
  reverse?: boolean;
};

export function FeatureCardRow({ items }: { items: FeatureItem[] }) {
  return (
    <section className="py-section bg-surface-soft">
      <div className="max-w-page mx-auto px-6 space-y-section">
        {items.map((item, i) => (
          <ScrollReveal key={i}>
            <div
              className={`grid md:grid-cols-2 gap-8 items-center ${
                item.reverse ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div
                className="aspect-[4/5] rounded-md bg-surface-card bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, #f6f6f3 0%, #e5e5e0 100%), url(${item.image})`,
                }}
                aria-hidden
              />
              <div className="space-y-4">
                <DisplayHeading as="h2" level="heading-xl">
                  {item.title}
                </DisplayHeading>
                <p className="text-body-md text-body">{item.body}</p>
                <Button href={item.cta.href} variant="primary" size="md">
                  {item.cta.label}
                </Button>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

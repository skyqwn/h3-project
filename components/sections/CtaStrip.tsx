import { Button } from "@/components/ui/Button";

type Props = {
  title: string;
  ctaLabel: string;
  ctaHref: string;
};

export function CtaStrip({ title, ctaLabel, ctaHref }: Props) {
  return (
    <section className="bg-surface-dark text-on-dark py-12 px-6">
      <div className="max-w-page mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <h2 className="text-heading-xl">{title}</h2>
        <Button href={ctaHref} variant="primary" size="md" arrow>
          {ctaLabel}
        </Button>
      </div>
    </section>
  );
}

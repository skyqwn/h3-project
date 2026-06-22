import type { LegalDoc } from "@/lib/legal";

// Numbered ("1. ") or appendix ("가. ") clauses get a small indent so the
// document reads as a structured legal text rather than a wall of paragraphs.
const isClauseItem = (line: string) => /^(\d+|[가-힣])\.\s/.test(line);

export function LegalDocView({
  doc,
  effectiveDateLabel,
}: {
  doc: LegalDoc;
  effectiveDateLabel: string;
}) {
  return (
    <div className="max-w-narrow">
      <p className="text-caption-md text-mute mb-10 tabular-nums">
        {effectiveDateLabel} {doc.effectiveDate}
      </p>

      {doc.intro.length > 0 && (
        <div className="space-y-4 mb-12">
          {doc.intro.map((p, i) => (
            <p key={i} className="text-body-md text-body leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {doc.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-heading-md text-ink mb-3">{section.heading}</h2>
            <div className="space-y-2.5">
              {section.body.map((line, j) => (
                <p
                  key={j}
                  className={`text-body-md text-body leading-relaxed ${
                    isClauseItem(line) ? "pl-4" : ""
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

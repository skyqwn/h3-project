import { Link } from "@/i18n/routing";
import type { Notice } from "@/lib/notices";

type NoticeDetailLabels = {
  dateLabel: string;
  attachmentLabel: string;
  back: string;
};

export function NoticeDetailView({
  notice,
  labels,
}: {
  notice: Notice;
  labels: NoticeDetailLabels;
}) {
  const hasBody = (notice.body?.length ?? 0) > 0;
  const hasFiles = (notice.attachments?.length ?? 0) > 0;

  return (
    <div className="max-w-narrow">
      <p className="text-caption-md text-mute mb-10 tabular-nums">
        {labels.dateLabel} {notice.date}
      </p>

      {hasBody && (
        <div className="space-y-4">
          {notice.body!.map((p, i) => (
            <p key={i} className="text-body-md text-body leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )}

      {hasFiles && (
        <div className="mt-12">
          <h2 className="text-heading-md text-ink mb-3">
            {labels.attachmentLabel}
          </h2>
          <ul className="space-y-2">
            {notice.attachments!.map((a) => (
              <li key={a.href}>
                <a
                  href={a.href}
                  download
                  className="text-body-md text-primary underline-offset-4 hover:underline"
                >
                  {a.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-16 border-t border-hairline-soft pt-6">
        <Link
          href="/notice"
          className="text-body-sm text-mute transition-colors hover:text-ink"
        >
          ← {labels.back}
        </Link>
      </div>
    </div>
  );
}

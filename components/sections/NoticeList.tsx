import { Link } from "@/i18n/routing";
import type { Notice } from "@/lib/notices";

type NoticeListLabels = {
  intro: string;
  colNumber: string;
  colTitle: string;
  colDate: string;
  colAttachment: string;
  /** Shown in the 첨부 column when a notice has attachments (e.g. "PDF"). */
  attachmentBadge: string;
  empty: string;
};

// Column track shared by the header row and each notice row so they align.
const COLS = "sm:grid-cols-[3.5rem_1fr_7rem_4rem]";

export function NoticeList({
  notices,
  labels,
}: {
  notices: Notice[];
  labels: NoticeListLabels;
}) {
  return (
    <div className="max-w-narrow">
      <p className="text-body-md text-body mb-12 leading-relaxed">
        {labels.intro}
      </p>

      {notices.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface-card px-6 py-16 text-center">
          <p className="text-body-md text-mute">{labels.empty}</p>
        </div>
      ) : (
        <>
          {/* Column header — desktop only; rows stack into cards on mobile. */}
          <div
            className={`hidden border-y border-hairline px-2 py-3 text-caption-md font-bold text-mute sm:grid ${COLS} sm:gap-4`}
          >
            <span>{labels.colNumber}</span>
            <span>{labels.colTitle}</span>
            <span>{labels.colDate}</span>
            <span className="text-right">{labels.colAttachment}</span>
          </div>

          <ul>
            {notices.map((n) => {
              const hasFile = (n.attachments?.length ?? 0) > 0;
              return (
                <li key={n.id} className="border-b border-hairline">
                  <Link
                    href={`/notice/${n.id}`}
                    className={`group block px-2 py-5 transition-colors hover:bg-surface-card sm:grid ${COLS} sm:items-center sm:gap-4 sm:py-4`}
                  >
                    <span className="hidden text-body-sm tabular-nums text-mute sm:block">
                      {n.id}
                    </span>
                    <span className="text-body-md text-ink transition-colors group-hover:text-primary">
                      {n.title}
                    </span>
                    <span className="mt-1 block text-body-sm tabular-nums text-mute sm:mt-0">
                      {n.date}
                    </span>
                    <span className="text-body-sm text-mute sm:text-right">
                      {hasFile ? labels.attachmentBadge : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

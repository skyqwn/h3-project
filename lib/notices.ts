// Electronic public notices (전자공고). The Korea Commercial Act and the
// company's articles of incorporation (정관) require corporate notices to be
// published; this page is H3's official electronic-notice channel. Notices are
// stored as data (Korean) — like lib/legal.ts — because they are long-form
// Korean legal text, not bilingual UI strings. Attached PDFs live under
// public/notices/ and are referenced by path.

export type NoticeAttachment = {
  /** Filename shown to the reader, e.g. "주주총회소집공고.pdf". */
  label: string;
  /** Public path, e.g. "/notices/2026-agm.pdf". */
  href: string;
};

export type Notice = {
  /**
   * Stable identifier used in the URL (/notice/[id]) and the 번호 column.
   * Assign once and never reuse — notices are a permanent legal record.
   */
  id: number;
  /** 공고 제목 (Korean). */
  title: string;
  /** 공고일, ISO "YYYY-MM-DD". */
  date: string;
  /** 본문 단락 (optional — a PDF-only notice can omit this). */
  body?: string[];
  /** 첨부 PDF (optional). */
  attachments?: NoticeAttachment[];
};

// No notices published yet. Add entries here — order does not matter, the
// page sorts by 공고일 (date). Example:
//   {
//     id: 1,
//     title: "정기주주총회 소집공고",
//     date: "2026-07-15",
//     body: ["..."],
//     attachments: [{ label: "주주총회소집공고.pdf", href: "/notices/2026-agm.pdf" }],
//   }
export const NOTICES: Notice[] = [];

/** Notices in display order: newest 공고일 first, id as the tiebreaker. */
export function getNotices(): Notice[] {
  return [...NOTICES].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  );
}

/** Find one notice by its numeric id (taken from the URL). */
export function getNotice(id: number): Notice | undefined {
  return NOTICES.find((n) => n.id === id);
}

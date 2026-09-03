// URL 슬러그: 소문자 영숫자 + 하이픈, 앞뒤 하이픈 없음.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

// 임의 문자열 → 슬러그 후보(공백/특수문자 → 하이픈, 소문자화, 양끝 하이픈 정리).
export function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

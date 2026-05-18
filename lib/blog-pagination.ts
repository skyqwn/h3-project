export const PAGE_SIZE = 10;

export type Paginated<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

/** 1-indexed pagination. Throws on out-of-range page (caller -> notFound()). */
export function paginate<T>(all: T[], page: number): Paginated<T> {
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  if (page < 1 || page > totalPages) {
    throw new Error(`page ${page} out of range (1..${totalPages})`);
  }
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: all.slice(start, start + PAGE_SIZE),
    page,
    totalPages,
  };
}

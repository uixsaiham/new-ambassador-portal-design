import { useEffect, useState } from "react";

// Client-side pagination for the admin tables. Slices an already-filtered array
// into fixed-size pages and keeps the current page in range when the data
// shrinks (e.g. a filter narrows the results below the current page). Data
// refreshes (the 30s auto-poll) do NOT reset the page — only going out of range
// clamps it — so an admin reading page 3 stays put. Reset-to-1 on a filter
// change is wired per-page where the filter state lives.
export function usePagination<T>(items: T[], pageSize = 15) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { page, setPage, pageCount, pageItems, pageSize, total };
}

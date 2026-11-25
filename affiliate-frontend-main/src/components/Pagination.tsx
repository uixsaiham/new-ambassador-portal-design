"use client";

import AppIcon from "@/components/AppIcon";
interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

// Windowed page numbers: always show first & last, the current page ±1, and
// collapse the rest into ellipses so the control stays compact past ~7 pages.
function pageWindow(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, page - 1);
  const right = Math.min(pageCount - 1, page + 1);
  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < pageCount - 1) pages.push("…");
  pages.push(pageCount);
  return pages;
}

export default function Pagination({ page, pageCount, total, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "min-w-[34px] h-[34px] px-2 inline-flex items-center justify-center rounded-[8px] text-xs font-bold border transition-colors";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <p className="text-xs text-slate-500 font-semibold order-2 sm:order-1">
        Showing <span className="text-slate-300">{from}–{to}</span> of <span className="text-slate-300">{total}</span>
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5 order-1 sm:order-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`${btn} bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label="Previous page"
          >
            <AppIcon className="fa-solid fa-chevron-left"></AppIcon>
          </button>
          {pageWindow(page, pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-slate-600 text-xs select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`${btn} ${
                  p === page
                    ? "bg-orange-600 border-orange-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className={`${btn} bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label="Next page"
          >
            <AppIcon className="fa-solid fa-chevron-right"></AppIcon>
          </button>
        </div>
      )}
    </div>
  );
}

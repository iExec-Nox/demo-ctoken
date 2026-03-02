"use client";

import { useMemo, useState } from "react";
import { ActivityTable } from "./activity-table";
import {
  MOCK_ACTIVITIES,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_CONFIG,
  type ActivityType,
} from "@/lib/activity";

const ITEMS_PER_PAGE = 10;

type FilterValue = "all" | ActivityType;

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All Actions", value: "all" },
  ...ACTIVITY_TYPES.map((type) => ({
    label: ACTIVITY_TYPE_CONFIG[type].label,
    value: type as FilterValue,
  })),
];

export function ExplorerContent() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? MOCK_ACTIVITIES
        : MOCK_ACTIVITIES.filter((a) => a.type === filter),
    [filter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  function handleFilterChange(value: FilterValue) {
    setFilter(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6 md:gap-10 md:px-10 md:py-10 lg:px-[114px]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-anybody text-2xl font-bold leading-9 tracking-tight text-text-heading md:text-[30px]">
            Activity
          </h1>
          <p className="mt-1 font-inter text-sm text-text-body md:mt-2">
            Monitor your confidential transactions on the Arbitrum network.
          </p>
        </div>

        <div className="flex w-full items-center gap-4 md:w-auto">
          <span className="font-inter text-xs font-bold uppercase tracking-wider text-text-muted">
            Filter By:
          </span>
          <div className="relative flex-1 md:flex-initial">
            <select
              value={filter}
              onChange={(e) =>
                handleFilterChange(e.target.value as FilterValue)
              }
              aria-label="Filter by action type"
              className="w-full cursor-pointer appearance-none rounded-lg border border-surface-border bg-surface py-2 pl-4 pr-10 font-inter text-base font-medium text-text-heading backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 md:w-auto md:text-sm"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-icons text-[20px]! text-text-muted">
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <ActivityTable entries={paginated} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="font-inter text-xs font-medium text-text-muted">
          Showing {paginated.length} of {filtered.length} transactions
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="cursor-pointer p-1 text-text-muted transition-colors hover:text-text-heading disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden="true" className="material-icons text-[24px]!">chevron_left</span>
          </button>

          <span className="flex min-w-[30px] items-center justify-center rounded border border-surface-border bg-surface px-3 py-1 font-inter text-xs font-medium text-text-heading backdrop-blur-sm">
            {page}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="cursor-pointer p-1 text-text-muted transition-colors hover:text-text-heading disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span aria-hidden="true" className="material-icons text-[24px]!">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}

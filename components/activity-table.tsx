"use client";

import type { ActivityEntry } from "@/lib/activity";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/activity";

const COLUMNS = ["Action", "Asset", "Amount", "Time", "Details"] as const;

interface ActivityTableProps {
  entries: ActivityEntry[];
}

export function ActivityTable({ entries }: ActivityTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-surface-border bg-surface backdrop-blur-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-border">
            {COLUMNS.map((col) => (
              <th
                key={col}
                className={`px-6 py-4 font-inter text-xs font-bold uppercase tracking-wider text-text-muted ${
                  col === "Amount" || col === "Details"
                    ? "text-right"
                    : col === "Time"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {entries.map((entry) => (
            <ActivityTableRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTableRow({ entry }: { entry: ActivityEntry }) {
  const config = ACTIVITY_TYPE_CONFIG[entry.type];

  return (
    <tr className="bg-surface/50 transition-colors hover:bg-surface">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${config.iconBg}`}
          >
            <span
              className={`material-icons text-[18px]! ${config.iconColor}`}
            >
              {config.icon}
            </span>
          </div>
          <span className="font-inter text-sm font-bold text-text-heading">
            {config.label}
          </span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="font-inter text-sm font-medium text-text-body">
          {entry.asset}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <span className="font-inter text-sm font-medium text-text-heading">
          {entry.amount}
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-inter text-sm text-text-muted">
          {entry.timestamp}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <a
          href={`https://sepolia.arbiscan.io/tx/${entry.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-inter text-xs font-bold text-primary transition-colors hover:text-primary-hover"
        >
          Arbiscan
          <span className="material-icons text-[14px]!">north_east</span>
        </a>
      </td>
    </tr>
  );
}

import type { ActivityEntry } from '@/lib/activity';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/activity';

const COLUMNS = ['Action', 'Asset', 'Amount', 'Time', 'Details'] as const;

interface ActivityTableProps {
  entries: ActivityEntry[];
}

export function ActivityTable({ entries }: ActivityTableProps) {
  return (
    <>
      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {entries.map((entry) => (
          <ActivityCard key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="border-surface-border bg-surface hidden w-full overflow-hidden rounded-2xl border backdrop-blur-sm md:block">
        <table className="w-full">
          <caption className="sr-only">Transaction history</caption>
          <thead>
            <tr className="border-surface-border border-b">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={`font-inter text-text-muted px-6 py-4 text-xs font-bold tracking-wider uppercase ${
                    col === 'Amount' || col === 'Details'
                      ? 'text-right'
                      : col === 'Time'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-surface-border divide-y">
            {entries.map((entry) => (
              <ActivityTableRow key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ActivityCard({ entry }: { entry: ActivityEntry }) {
  const config = ACTIVITY_TYPE_CONFIG[entry.type];

  return (
    <div className="border-surface-border bg-surface rounded-xl border p-4 backdrop-blur-sm">
      {/* Row 1: Action + Asset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${config.iconBg}`}
          >
            <span
              aria-hidden="true"
              className={`material-icons text-[16px]! ${config.iconColor}`}
            >
              {config.icon}
            </span>
          </div>
          <span className="font-inter text-text-heading text-sm font-bold">
            {config.label}
          </span>
        </div>
        <span className="font-inter text-text-body text-sm font-medium">
          {entry.asset}
        </span>
      </div>

      {/* Row 2: Amount + Time + Arbiscan */}
      <div className="border-surface-border mt-3 flex items-center justify-between border-t pt-3">
        <span className="font-inter text-text-heading text-sm font-medium">
          {entry.amount}
        </span>
        <span className="font-inter text-text-muted text-xs">
          {entry.timestamp}
        </span>
        <a
          href={`https://sepolia.arbiscan.io/tx/${entry.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-inter text-primary hover:text-primary-hover inline-flex items-center gap-1 text-xs font-bold transition-colors"
        >
          Arbiscan
          <span aria-hidden="true" className="material-icons text-[14px]!">
            north_east
          </span>
        </a>
      </div>
    </div>
  );
}

function ActivityTableRow({ entry }: { entry: ActivityEntry }) {
  const config = ACTIVITY_TYPE_CONFIG[entry.type];

  return (
    <tr className="bg-surface/50 hover:bg-surface transition-colors">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 items-center justify-center rounded-lg ${config.iconBg}`}
          >
            <span
              aria-hidden="true"
              className={`material-icons text-[18px]! ${config.iconColor}`}
            >
              {config.icon}
            </span>
          </div>
          <span className="font-inter text-text-heading text-sm font-bold">
            {config.label}
          </span>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="font-inter text-text-body text-sm font-medium">
          {entry.asset}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <span className="font-inter text-text-heading text-sm font-medium">
          {entry.amount}
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-inter text-text-muted text-sm">
          {entry.timestamp}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <a
          href={`https://sepolia.arbiscan.io/tx/${entry.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-inter text-primary hover:text-primary-hover inline-flex items-center gap-1 text-xs font-bold transition-colors"
        >
          Arbiscan
          <span aria-hidden="true" className="material-icons text-[14px]!">
            north_east
          </span>
        </a>
      </td>
    </tr>
  );
}

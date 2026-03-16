import type { DelegatedViewEntry, DelegatedViewTab } from "@/lib/delegated-view";
import { getOperatorConfig } from "@/lib/delegated-view";
import { ARBISCAN_BASE_URL } from "@/lib/config";
import { truncateAddress } from "@/lib/utils";

// ── Shared helpers ─────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(seconds * 1000));
}

function truncateHandle(handle: string): string {
  if (handle.length <= 14) return handle;
  return `${handle.slice(0, 8)}...${handle.slice(-4)}`;
}

function OperatorBadge({ operator }: { operator: string }) {
  const config = getOperatorConfig(operator);
  return (
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
      <span className="font-inter text-sm font-bold text-text-heading">
        {config.label}
      </span>
    </div>
  );
}

function ArbiscanTxLink({ txHash }: { txHash: string }) {
  return (
    <a
      href={`${ARBISCAN_BASE_URL}/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-inter text-xs font-bold text-primary transition-colors hover:text-primary-hover"
    >
      Arbiscan
      <span aria-hidden="true" className="material-icons text-[14px]!">
        north_east
      </span>
    </a>
  );
}

// ── Props ──────────────────────────────────────────────────────────

interface DelegatedViewTableProps {
  entries: DelegatedViewEntry[];
  tab: DelegatedViewTab;
  decryptedValues: Record<string, string>;
  decryptingHandle: string | null;
  onDecrypt: (handleId: string) => void;
}

// ── Shared with me: columns ────────────────────────────────────────
// Origin | Shared by | Handle | Value | Date | Details

const SHARED_COLUMNS = [
  "Origin",
  "Shared by",
  "Handle",
  "Value",
  "Date",
  "Details",
] as const;

// ── My grants: columns ─────────────────────────────────────────────
// Origin | Viewer | Handle | Date | Details

const GRANTS_COLUMNS = [
  "Origin",
  "Viewer",
  "Handle",
  "Date",
  "Details",
] as const;

// ── Component ──────────────────────────────────────────────────────

export function DelegatedViewTable({
  entries,
  tab,
  decryptedValues,
  decryptingHandle,
  onDecrypt,
}: DelegatedViewTableProps) {
  return (
    <>
      {/* Mobile: card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {entries.map((entry) => (
          <MobileCard
            key={entry.id}
            entry={entry}
            tab={tab}
            decryptedValues={decryptedValues}
            decryptingHandle={decryptingHandle}
            onDecrypt={onDecrypt}
          />
        ))}
      </div>

      {/* Desktop: table layout */}
      <div className="hidden w-full overflow-hidden rounded-2xl border border-surface-border bg-surface backdrop-blur-sm md:block">
        <table className="w-full">
          <caption className="sr-only">
            {tab === "shared"
              ? "Handles shared with you"
              : "Viewer access you have granted"}
          </caption>
          <thead>
            <tr className="border-b border-surface-border">
              {(tab === "shared" ? SHARED_COLUMNS : GRANTS_COLUMNS).map(
                (col) => (
                  <th
                    key={col}
                    scope="col"
                    className={`px-6 py-4 font-inter text-xs font-bold uppercase tracking-wider text-text-muted ${
                      col === "Details" || col === "Value"
                        ? "text-right"
                        : col === "Date"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {entries.map((entry) =>
              tab === "shared" ? (
                <SharedRow
                  key={entry.id}
                  entry={entry}
                  decryptedValues={decryptedValues}
                  decryptingHandle={decryptingHandle}
                  onDecrypt={onDecrypt}
                />
              ) : (
                <GrantsRow key={entry.id} entry={entry} />
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Desktop rows ───────────────────────────────────────────────────

function SharedRow({
  entry,
  decryptedValues,
  decryptingHandle,
  onDecrypt,
}: {
  entry: DelegatedViewEntry;
  decryptedValues: Record<string, string>;
  decryptingHandle: string | null;
  onDecrypt: (handleId: string) => void;
}) {
  const isDecrypting = decryptingHandle === entry.handleId;
  const decrypted = decryptedValues[entry.handleId];

  return (
    <tr className="bg-surface/50 transition-colors hover:bg-surface">
      <td className="px-6 py-5">
        <OperatorBadge operator={entry.operator} />
      </td>
      <td className="px-6 py-5">
        <span className="font-inter text-sm font-medium text-text-body">
          {truncateAddress(entry.counterparty)}
        </span>
      </td>
      <td className="px-6 py-5">
        <span className="font-mono text-xs text-text-body">
          {truncateHandle(entry.handleId)}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        {decrypted ? (
          <span className="font-inter text-sm font-medium text-text-heading">
            {decrypted}
            <span className="ml-1 text-xs text-text-muted">(raw)</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onDecrypt(entry.handleId)}
            disabled={isDecrypting}
            className="inline-flex cursor-pointer items-center gap-1 font-inter text-xs font-bold text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Decrypt handle ${truncateHandle(entry.handleId)}`}
          >
            {isDecrypting ? (
              <span
                aria-hidden="true"
                className="material-icons animate-spin text-[16px]!"
              >
                sync
              </span>
            ) : (
              <>
                <span className="text-text-muted">******</span>
                <span
                  aria-hidden="true"
                  className="material-icons text-[16px]!"
                >
                  visibility
                </span>
              </>
            )}
          </button>
        )}
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-inter text-sm text-text-muted">
          {formatTimestamp(entry.timestamp)}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <ArbiscanTxLink txHash={entry.txHash} />
      </td>
    </tr>
  );
}

function GrantsRow({ entry }: { entry: DelegatedViewEntry }) {
  return (
    <tr className="bg-surface/50 transition-colors hover:bg-surface">
      <td className="px-6 py-5">
        <OperatorBadge operator={entry.operator} />
      </td>
      <td className="px-6 py-5">
        <span className="font-inter text-sm font-medium text-text-body">
          {truncateAddress(entry.counterparty)}
        </span>
      </td>
      <td className="px-6 py-5">
        <span className="font-mono text-xs text-text-body">
          {truncateHandle(entry.handleId)}
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-inter text-sm text-text-muted">
          {formatTimestamp(entry.timestamp)}
        </span>
      </td>
      <td className="px-6 py-5 text-right">
        <ArbiscanTxLink txHash={entry.txHash} />
      </td>
    </tr>
  );
}

// ── Mobile card ────────────────────────────────────────────────────

function MobileCard({
  entry,
  tab,
  decryptedValues,
  decryptingHandle,
  onDecrypt,
}: {
  entry: DelegatedViewEntry;
  tab: DelegatedViewTab;
  decryptedValues: Record<string, string>;
  decryptingHandle: string | null;
  onDecrypt: (handleId: string) => void;
}) {
  const isDecrypting = decryptingHandle === entry.handleId;
  const decrypted = decryptedValues[entry.handleId];

  return (
    <div className="rounded-xl border border-surface-border bg-surface p-4 backdrop-blur-sm">
      {/* Row 1: Operator + Counterparty */}
      <div className="flex items-center justify-between">
        <OperatorBadge operator={entry.operator} />
        <span className="font-inter text-sm font-medium text-text-body">
          {truncateAddress(entry.counterparty)}
        </span>
      </div>

      {/* Row 2: Handle + Value (shared) or Date (grants) */}
      <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
        <span className="font-mono text-xs text-text-body">
          {truncateHandle(entry.handleId)}
        </span>

        {tab === "shared" && (
          <>
            {decrypted ? (
              <span className="font-inter text-sm font-medium text-text-heading">
                {decrypted}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onDecrypt(entry.handleId)}
                disabled={isDecrypting}
                className="inline-flex cursor-pointer items-center gap-1 font-inter text-xs font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Decrypt handle ${truncateHandle(entry.handleId)}`}
              >
                {isDecrypting ? (
                  <span
                    aria-hidden="true"
                    className="material-icons animate-spin text-[16px]!"
                  >
                    sync
                  </span>
                ) : (
                  <>
                    <span className="text-text-muted">******</span>
                    <span
                      aria-hidden="true"
                      className="material-icons text-[16px]!"
                    >
                      visibility
                    </span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Row 3: Date + Arbiscan */}
      <div className="mt-3 flex items-center justify-between border-t border-surface-border pt-3">
        <span className="font-inter text-xs text-text-muted">
          {formatTimestamp(entry.timestamp)}
        </span>
        <ArbiscanTxLink txHash={entry.txHash} />
      </div>
    </div>
  );
}

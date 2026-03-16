// ── Tabs ───────────────────────────────────────────────────────────

export type DelegatedViewTab = "shared" | "grants";

export const DELEGATED_VIEW_TABS: {
  label: string;
  value: DelegatedViewTab;
}[] = [
  { label: "Shared with me", value: "shared" },
  { label: "My grants", value: "grants" },
];

// ── Operator config ────────────────────────────────────────────────

interface OperatorConfig {
  label: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export const OPERATOR_CONFIG: Record<string, OperatorConfig> = {
  Mint: {
    label: "Wrap",
    icon: "add_box",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  Burn: {
    label: "Unwrap",
    icon: "move_to_inbox",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
  },
  Transfer: {
    label: "Transfer",
    icon: "send",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  Add: {
    label: "Delegation",
    icon: "group_add",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
  PlaintextToEncrypted: {
    label: "Encrypted",
    icon: "lock",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
};

const FALLBACK_OPERATOR: OperatorConfig = {
  label: "Unknown",
  icon: "help_outline",
  iconColor: "text-text-muted",
  iconBg: "bg-surface-border",
};

export function getOperatorConfig(operator: string): OperatorConfig {
  return OPERATOR_CONFIG[operator] ?? FALLBACK_OPERATOR;
}

// ── Entry type ─────────────────────────────────────────────────────

export interface DelegatedViewEntry {
  id: string;
  handleId: string;
  counterparty: string;
  operator: string;
  timestamp: number;
  txHash: string;
  isPubliclyDecryptable: boolean;
}

// ── CSV Export ──────────────────────────────────────────────────────

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatTimestampForExport(seconds: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(seconds * 1000));
}

export function exportToCsv(
  entries: DelegatedViewEntry[],
  tab: DelegatedViewTab,
  decryptedValues: Record<string, string>,
) {
  const isShared = tab === "shared";

  const headers = isShared
    ? ["Origin", "Shared by", "Handle", "Value", "Date", "Tx Hash"]
    : ["Origin", "Viewer", "Handle", "Date", "Tx Hash"];

  const rows = entries.map((entry) => {
    const origin = getOperatorConfig(entry.operator).label;
    const date = formatTimestampForExport(entry.timestamp);
    if (isShared) {
      const value = decryptedValues[entry.handleId] ?? "Encrypted";
      return [origin, entry.counterparty, entry.handleId, value, date, entry.txHash];
    }
    return [origin, entry.counterparty, entry.handleId, date, entry.txHash];
  });

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delegated-view-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

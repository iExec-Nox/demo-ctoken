export type ActivityType = "wrap" | "unwrap" | "transfer" | "delegation";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  asset: string;
  amount: string;
  timestamp: string;
  txHash: string;
}

export interface ActivityTypeConfig {
  label: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  wrap: {
    label: "Wrap",
    icon: "add_box",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  transfer: {
    label: "Transfer",
    icon: "send",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  unwrap: {
    label: "Unwrap",
    icon: "move_to_inbox",
    iconColor: "text-orange-400",
    iconBg: "bg-orange-500/10",
  },
  delegation: {
    label: "Delegation",
    icon: "group",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
  },
};

export const ACTIVITY_TYPES: ActivityType[] = [
  "wrap",
  "unwrap",
  "transfer",
  "delegation",
];

export const MOCK_ACTIVITIES: ActivityEntry[] = [
  {
    id: "1",
    type: "wrap",
    asset: "cUSDC",
    amount: "1,250.00",
    timestamp: "12/02/2026 10:02",
    txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  },
  {
    id: "2",
    type: "transfer",
    asset: "ETH",
    amount: "0.45",
    timestamp: "12/02/2026 10:02",
    txHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  },
  {
    id: "3",
    type: "unwrap",
    asset: "cUSDT",
    amount: "500.00",
    timestamp: "12/02/2026 10:02",
    txHash: "0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
  },
  {
    id: "4",
    type: "delegation",
    asset: "cRLC",
    amount: "10,000",
    timestamp: "12/02/2026 10:02",
    txHash: "0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd",
  },
];

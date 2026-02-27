import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "./action-button";

const ACTIONS = [
  {
    icon: "layers",
    label: "Wrap",
    description: "Public to Private",
    href: "/wrap",
  },
  {
    icon: "layers_clear",
    label: "Unwrap",
    description: "Private to Public",
    href: "/wrap",
  },
  {
    icon: "send",
    label: "Transfer",
    description: "Private Transfer",
    href: "/transfer",
  },
  {
    icon: "key",
    label: "Selective Disclosure",
    description: "Delegate View",
    href: "/delegate",
  },
] as const;

interface ActionCenterProps {
  hasBalance: boolean;
}

export function ActionCenter({ hasBalance }: ActionCenterProps) {
  return (
    <Card className="w-[290px] shrink-0 gap-7 rounded-3xl border-surface-border bg-surface p-[25px] backdrop-blur-sm">
      {/* Warning banner */}
      {!hasBalance && (
        <div className="flex items-center gap-2 rounded-xl border border-info-banner-border bg-info-banner-bg p-[13px]">
          <span className="material-icons text-[14px]! text-text-heading">info</span>
          <p className="font-mulish text-[13px] font-bold leading-[16.5px] tracking-[-0.275px] text-text-heading">
            Fund your wallet to unlock these actions
          </p>
        </div>
      )}

      {/* Title */}
      <p className="font-mulish text-sm font-bold uppercase tracking-[1.4px] text-text-muted">
        Action Center
      </p>

      {/* Action buttons */}
      <CardContent className="flex flex-col gap-3 p-0">
        {ACTIONS.map((action) => (
          <ActionButton
            key={action.label}
            icon={action.icon}
            label={action.label}
            description={action.description}
            disabled={!hasBalance}
            href={action.href}
          />
        ))}
      </CardContent>

      {/* Privacy Status */}
      <div className="flex flex-col gap-2 rounded-2xl border border-surface-border bg-surface p-[17px]">
        <div className="flex items-center gap-1.5">
          <span className="material-icons text-[14px]! text-text-muted">
            verified_user
          </span>
          <p className="font-mulish text-xs font-bold tracking-[0.3px] text-text-muted">
            Privacy Status
          </p>
        </div>
        <p className="font-mulish text-xs leading-[19.5px] text-asset-text-tertiary">
          {hasBalance
            ? "Tokens detected. You can now wrap assets into confidential tokens."
            : "No confidential assets detected. Shielded transactions require an initial balance."}
        </p>
      </div>
    </Card>
  );
}

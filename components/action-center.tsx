"use client";

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
    <div className="flex w-[290px] shrink-0 flex-col gap-7 rounded-3xl border border-white/8 bg-white/3 p-[25px] backdrop-blur-sm">
      {/* Warning banner */}
      {!hasBalance && (
        <div className="flex items-center gap-2 rounded-xl border border-[rgba(71,37,244,0.2)] bg-[rgba(116,142,255,0.27)] p-[13px]">
          <span className="material-icons text-[14px]! text-white">info</span>
          <p className="font-mulish text-[13px] font-bold leading-[16.5px] tracking-[-0.275px] text-white">
            Fund your wallet to unlock these actions
          </p>
        </div>
      )}

      {/* Title */}
      <p className="font-mulish text-sm font-bold uppercase tracking-[1.4px] text-slate-400">
        Action Center
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
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
      </div>

      {/* Privacy Status */}
      <div className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/2 p-[17px]">
        <div className="flex items-center gap-1.5">
          <span className="material-icons text-[14px]! text-slate-500">
            verified_user
          </span>
          <p className="font-mulish text-xs font-bold tracking-[0.3px] text-slate-500">
            Privacy Status
          </p>
        </div>
        <p className="font-mulish text-xs leading-[19.5px] text-slate-600">
          {hasBalance
            ? "Tokens detected. You can now wrap assets into confidential tokens."
            : "No confidential assets detected. Shielded transactions require an initial balance."}
        </p>
      </div>
    </div>
  );
}

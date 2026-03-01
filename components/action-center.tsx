"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ActionButton } from "./action-button";
import { useWrapModal } from "./wrap-modal-provider";
import { useTransferModal } from "./transfer-modal-provider";
import { useSelectiveDisclosureModal } from "./selective-disclosure-modal-provider";

interface ActionCenterProps {
  hasBalance: boolean;
}

export function ActionCenter({ hasBalance }: ActionCenterProps) {
  const { openWrap, openUnwrap } = useWrapModal();
  const { openTransfer } = useTransferModal();
  const { openSelectiveDisclosure } = useSelectiveDisclosureModal();

  const ACTIONS = [
    {
      icon: "layers",
      label: "Wrap",
      description: "Public to Private",
      onClick: openWrap,
    },
    {
      icon: "layers_clear",
      label: "Unwrap",
      description: "Private to Public",
      onClick: openUnwrap,
    },
    {
      icon: "send",
      label: "Transfer",
      description: "Private Transfer",
      onClick: openTransfer,
    },
    {
      icon: "key",
      label: "Selective Disclosure",
      description: "Delegate View",
      onClick: openSelectiveDisclosure,
    },
  ] as const;

  return (
    <Card className="w-[290px] shrink-0 gap-7 rounded-3xl border-surface-border bg-surface p-[25px] backdrop-blur-sm">
      {/* Warning banner */}
      {!hasBalance && (
        <div className="flex items-center gap-2 rounded-xl border border-info-banner-border bg-info-banner-bg p-[13px]">
          <span aria-hidden="true" className="material-icons text-[14px]! text-text-heading">info</span>
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
            onClick={action.onClick}
          />
        ))}
      </CardContent>

      {/* Privacy Status */}
      <div className="flex flex-col gap-2 rounded-2xl border border-surface-border bg-surface p-[17px]">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="material-icons text-[14px]! text-text-muted">
            verified_user
          </span>
          <p className="font-mulish text-xs font-bold tracking-[0.3px] text-text-muted">
            Privacy Status
          </p>
        </div>
        <p className={`text-xs leading-[19.5px] ${hasBalance ? "font-inter text-asset-text-secondary" : "font-mulish text-asset-text-tertiary"}`}>
          {hasBalance
            ? "Your confidential assets are shielded using TEE. Metadata is obfuscated on the public ledger."
            : "No confidential assets detected. Shielded transactions require an initial balance."}
        </p>
      </div>
    </Card>
  );
}

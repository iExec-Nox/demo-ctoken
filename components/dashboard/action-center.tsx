'use client';

import { ActionButton } from './action-button';
import { useSelectiveDisclosureModal } from '@/components/modals/selective-disclosure-modal-provider';
import { useTransferModal } from '@/components/modals/transfer-modal-provider';
import { useWrapModal } from '@/components/modals/wrap-modal-provider';
import { Card, CardContent } from '@/components/ui/card';

interface ActionCenterProps {
  hasBalance: boolean;
}

export function ActionCenter({ hasBalance }: ActionCenterProps) {
  const { openWrap, openUnwrap } = useWrapModal();
  const { openTransfer } = useTransferModal();
  const { openSelectiveDisclosure } = useSelectiveDisclosureModal();

  const ACTIONS = [
    {
      icon: 'layers',
      label: 'Wrap',
      description: 'Public to Private',
      onClick: openWrap,
    },
    {
      icon: 'layers_clear',
      label: 'Unwrap',
      description: 'Private to Public',
      onClick: openUnwrap,
    },
    {
      icon: 'send',
      label: 'Transfer',
      description: 'Private Transfer',
      onClick: openTransfer,
    },
    {
      icon: 'key',
      label: 'Selective Disclosure',
      description: 'Delegate View',
      onClick: openSelectiveDisclosure,
    },
  ] as const;

  return (
    <Card className="dark:border-surface-border dark:bg-surface w-full max-w-[342px] gap-7 rounded-3xl border-[rgba(255,255,255,0.08)] bg-[#e3ecff] p-[25px] shadow-none backdrop-blur-sm md:w-[300px] md:max-w-[300px] md:shrink-0">
      {/* Warning banner */}
      {!hasBalance && (
        <div className="border-info-banner-border bg-info-banner-bg flex items-center gap-2 rounded-xl border p-[13px]">
          <span
            aria-hidden="true"
            className="material-icons text-text-heading text-[14px]!"
          >
            info
          </span>
          <p className="font-mulish text-text-heading text-[13px] leading-[16.5px] font-bold tracking-[-0.275px]">
            Fund your wallet to unlock these actions
          </p>
        </div>
      )}

      {/* Title */}
      <p className="font-mulish text-text-body text-sm font-bold tracking-[1.4px]">
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
      <div className="dark:border-surface-border dark:bg-surface flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.56)] p-2.5 md:p-[17px]">
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="material-icons text-text-body text-[14px]!"
          >
            verified_user
          </span>
          <p className="font-mulish text-text-body text-xs font-bold tracking-[0.3px]">
            Privacy Status
          </p>
        </div>
        <p
          className={`text-xs leading-[19.5px] ${hasBalance ? 'font-inter text-text-body' : 'font-mulish text-asset-text-tertiary'}`}
        >
          {hasBalance
            ? 'Your confidential assets are shielded using TEE. Metadata is obfuscated on the public ledger.'
            : 'No confidential assets detected. Shielded transactions require an initial balance.'}
        </p>
      </div>
    </Card>
  );
}

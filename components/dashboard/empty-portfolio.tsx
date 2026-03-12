'use client';

import { useFaucetModal } from '@/components/modals/faucet-modal-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function EmptyPortfolio() {
  const { setOpen } = useFaucetModal();

  return (
    <Card className="border-surface-border bg-surface flex flex-1 flex-col items-center justify-center rounded-[32px] px-5 py-12 backdrop-blur-sm md:px-10 md:py-24">
      <div className="flex flex-col items-center gap-[29px]">
        <div className="border-surface-border bg-asset-icon-bg flex size-20 items-center justify-center rounded-full border">
          <span
            aria-hidden="true"
            className="material-icons text-text-muted text-[36px]!"
          >
            account_balance_wallet
          </span>
        </div>

        <h2 className="font-mulish text-text-heading text-2xl font-bold">
          Your portfolio is empty
        </h2>

        <p className="font-mulish text-text-body max-w-sm text-center text-base leading-[26px]">
          To explore the Confidential Token demo, you first need testnet assets
          to cover gas and wrap into confidential tokens.
        </p>

        <Button
          onClick={() => setOpen(true)}
          className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover h-auto cursor-pointer rounded-xl px-5 py-3 text-lg font-bold shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)]"
        >
          <span aria-hidden="true" className="material-icons text-[20px]!">
            account_balance_wallet
          </span>
          Go to Faucets
        </Button>
      </div>
    </Card>
  );
}

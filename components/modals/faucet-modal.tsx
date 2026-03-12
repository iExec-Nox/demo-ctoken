'use client';

import { FaucetCard } from './faucet-card';
import { useFaucetModal } from './faucet-modal-provider';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Image from 'next/image';

const FAUCET_TOKENS = [
  {
    name: 'Faucet ETH',
    category: 'Gas Asset',
    description: 'Used for transaction fees',
    icon: '/faucet-eth.svg',
    mintLabel: 'Mint ETH',
    href: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia',
  },
  {
    name: 'Faucet RLC',
    category: 'Assets',
    description: 'Used for private wrapping',
    icon: '/faucet-usdc.svg',
    mintLabel: 'Mint RLC',
    href: 'https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet',
  },
  {
    name: 'Faucet USDC',
    category: 'Assets',
    description: 'Used for private wrapping',
    icon: '/faucet-usdc.svg',
    mintLabel: 'Mint USDC',
    href: 'https://faucet.circle.com/',
  },
] as const;

export function FaucetModal() {
  const { open, setOpen } = useFaucetModal();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="border-modal-border bg-modal-bg data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 max-h-[90dvh] max-w-[calc(100%-2rem)] gap-2.5 overflow-y-auto rounded-[40px] p-[30px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 sm:max-w-[714px] sm:p-10"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="bg-primary relative size-[35px] overflow-hidden rounded-[10px] sm:size-16 sm:rounded-xl">
            <Image
              src="/nox-icon.png"
              alt=""
              fill
              className="object-cover brightness-0 invert"
            />
          </div>

          <DialogTitle className="font-mulish text-text-heading text-[26px] leading-10 font-bold sm:text-[34px]">
            Faucets
          </DialogTitle>

          <DialogDescription className="font-mulish text-text-body max-w-[448px] text-center text-xs leading-[26px] sm:text-base">
            Confidential transactions require testnet assets. Request tokens
            below to start exploring Confidential Token.
          </DialogDescription>
        </div>

        {/* Token cards */}
        <div className="flex flex-col gap-6 sm:flex-row">
          {FAUCET_TOKENS.map((token) => (
            <FaucetCard
              key={token.name}
              name={token.name}
              category={token.category}
              description={token.description}
              icon={token.icon}
              mintLabel={token.mintLabel}
              href={token.href}
            />
          ))}
        </div>

        {/* Limits warning */}
        <div className="text-text-muted flex items-center justify-center gap-2">
          <span aria-hidden="true" className="material-icons text-[14px]!">
            info
          </span>
          <p className="font-mulish text-xs font-medium">
            Limits: 0.1 ETH / 100 USDC per 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

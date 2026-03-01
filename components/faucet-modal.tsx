"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFaucetModal } from "./faucet-modal-provider";
import { FaucetCard } from "./faucet-card";

const FAUCET_TOKENS = [
  {
    name: "Faucet ETH",
    category: "Gas Asset",
    description: "Used for transaction fees",
    icon: "/faucet-eth.svg",
    mintLabel: "Mint ETH",
    href: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
  },
  {
    name: "Faucet RLC",
    category: "Assets",
    description: "Used for private wrapping",
    icon: "/faucet-usdc.svg",
    mintLabel: "Mint RLC",
    href: "https://explorer.iex.ec/arbitrum-sepolia-testnet/account?accountTab=Faucet",
  },
  {
    name: "Faucet USDC",
    category: "Assets",
    description: "Used for private wrapping",
    icon: "/faucet-usdc.svg",
    mintLabel: "Mint USDC",
    href: "https://faucet.circle.com/",
  },
] as const;

export function FaucetModal() {
  const { open, setOpen } = useFaucetModal();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-2.5 rounded-[40px] border-modal-border bg-modal-bg p-10 shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 sm:max-w-[714px]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative size-16 overflow-hidden rounded-xl bg-primary">
            <Image
              src="/nox-icon.png"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          <DialogTitle className="font-mulish text-[34px] font-bold leading-10 text-text-heading">
            Faucets
          </DialogTitle>

          <DialogDescription className="max-w-[448px] text-center font-mulish text-base leading-[26px] text-text-body">
            Confidential transactions require testnet assets. Request tokens
            below to start exploring Confidential Token.
          </DialogDescription>
        </div>

        {/* Token cards */}
        <div className="flex gap-6">
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
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <span aria-hidden="true" className="material-icons text-[14px]!">info</span>
          <p className="font-mulish text-xs font-medium">
            Limits: 0.1 ETH / 100 USDC per 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

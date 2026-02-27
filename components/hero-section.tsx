"use client";

import { useConnectWallet } from "@/hooks/use-connect-wallet";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  const { connect } = useConnectWallet();

  return (
    <section className="flex w-full flex-col items-start gap-10 px-40 py-16">
      <h1 className="w-full text-center font-anybody text-7xl font-bold leading-[72px] tracking-[-3.6px] text-text-heading">
        Try Confidential DeFi Now.
      </h1>
      <p className="w-full text-center font-mulish text-xl leading-7 text-text-body">
        Connect your wallet to encrypt a token balance
        <br />
        and experience private on-chain transfers in action.
      </p>
      <div className="flex w-full items-start justify-center gap-5">
        <Button
          onClick={connect}
          className="h-auto rounded-xl bg-primary px-5 py-4 font-mulish text-lg font-bold text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-primary-hover"
        >
          <span className="material-icons text-xl leading-7">account_balance_wallet</span>
          Try It Now
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-[60px] rounded-xl border border-ghost-btn-border bg-ghost-btn-bg px-5 py-4 font-mulish text-lg font-bold text-ghost-btn-text backdrop-blur-sm hover:bg-ghost-btn-bg hover:opacity-80"
        >
          <Link href="#">Talk to us</Link>
        </Button>
      </div>
    </section>
  );
}

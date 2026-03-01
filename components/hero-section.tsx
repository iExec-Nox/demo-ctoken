"use client";

import { useConnectWallet } from "@/hooks/use-connect-wallet";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  const { connect } = useConnectWallet();

  return (
    <section className="flex w-full flex-col items-center gap-5 px-10 py-10 md:gap-10 md:px-20 md:py-[60px] lg:px-40 lg:py-16">
      <h1 className="w-full text-center font-anybody text-4xl font-bold leading-none tracking-[-3.6px] text-text-heading md:text-7xl md:leading-[72px]">
        Private Finance.
        <br />
        In Action.
      </h1>
      <p className="w-full text-center font-mulish text-sm leading-7 text-text-body md:text-xl">
        Use Confidential Token to transform any ERC-20
        <br />
        into confidential and auditable on-chain assets.
      </p>
      <div className="flex w-full items-start justify-center gap-5">
        <Button
          onClick={connect}
          className="h-auto rounded-xl bg-primary px-2.5 py-2 font-mulish text-sm font-bold text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-primary-hover md:px-[18px] md:py-3 md:text-base"
        >
          <span className="material-icons text-base! leading-7 md:text-xl!">account_balance_wallet</span>
          Try It Now
        </Button>
        <Button
          asChild
          variant="ghost"
          className="h-auto rounded-xl border border-ghost-btn-border bg-ghost-btn-bg px-2.5 py-2 font-mulish text-base font-bold text-ghost-btn-text backdrop-blur-sm hover:bg-ghost-btn-bg hover:opacity-80 md:px-[18px] md:py-3"
        >
          <Link href="#">Talk To Us</Link>
        </Button>
      </div>
    </section>
  );
}

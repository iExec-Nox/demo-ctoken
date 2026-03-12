'use client';

import { Button } from '@/components/ui/button';
import { useConnectWallet } from '@/hooks/use-connect-wallet';
import { useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const { connect } = useConnectWallet();
  const { isConnected } = useAppKitAccount();
  const router = useRouter();

  function handleTryItNow() {
    if (isConnected) {
      router.push('/dashboard');
    } else {
      connect();
    }
  }

  return (
    <section className="flex w-full flex-col items-center gap-5 px-10 py-10 md:gap-10 md:px-20 md:py-[60px] lg:px-40 lg:py-16">
      <h1 className="font-anybody text-text-heading w-full text-center text-4xl leading-none font-bold tracking-[-3.6px] md:text-7xl md:leading-[72px]">
        Private Finance.
        <br />
        In Action.
      </h1>
      <p className="font-mulish text-text-body w-full text-center text-sm leading-7 md:text-xl">
        Use Confidential Token to transform any ERC-20
        <br />
        into confidential and auditable on-chain assets.
      </p>
      <div className="flex w-full items-start justify-center gap-5">
        <Button
          onClick={handleTryItNow}
          className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover h-auto rounded-xl px-2.5 py-2 text-sm font-bold shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] md:px-[18px] md:py-3 md:text-base"
        >
          <span
            aria-hidden="true"
            className="material-icons text-base! leading-7 md:text-xl!"
          >
            account_balance_wallet
          </span>
          Try It Now
        </Button>
        <Button
          asChild
          variant="ghost"
          className="border-ghost-btn-border bg-ghost-btn-bg font-mulish text-ghost-btn-text hover:bg-ghost-btn-bg h-auto rounded-xl border px-2.5 py-2 text-base font-bold backdrop-blur-sm hover:opacity-80 md:px-[18px] md:py-3"
        >
          <Link
            href="https://docs.nox.iex.ec/contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            Talk To Us
          </Link>
        </Button>
      </div>
    </section>
  );
}

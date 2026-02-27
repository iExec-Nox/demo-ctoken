"use client";

import { useState, useEffect, useMemo } from "react";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useTokenPrices } from "@/hooks/use-token-prices";
import { EmptyPortfolio } from "./empty-portfolio";
import { PublicAssets, formatUsd } from "./public-assets";
import { ConfidentialAssets } from "./confidential-assets";
import { ActionCenter } from "./action-center";
import { PortfolioHeader } from "./portfolio-header";

export function DashboardContent() {
  const [mounted, setMounted] = useState(false);
  const { balances, hasAnyBalance, isLoading } = useTokenBalances();
  const { prices } = useTokenPrices();

  useEffect(() => setMounted(true), []);

  const totalValue = useMemo(() => {
    let total = 0;
    for (const b of balances) {
      const price = prices[b.symbol];
      if (price && b.balance > 0n) {
        const num = Number(b.balance) / 10 ** b.decimals;
        total += num * price;
      }
    }
    return formatUsd(total);
  }, [balances, prices]);

  if (!mounted || isLoading) {
    return (
      <>
        <PortfolioHeader />
        <div className="flex items-start gap-[22px] px-10">
          <div className="flex flex-1 items-center justify-center rounded-[32px] border border-white/8 bg-white/3 py-24 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#748eff]" />
              <p className="font-mulish text-sm text-slate-400">
                Loading portfolio...
              </p>
            </div>
          </div>
          <div className="h-96 w-[290px] shrink-0 animate-pulse rounded-3xl border border-white/8 bg-white/3" />
        </div>
      </>
    );
  }

  return (
    <>
      <PortfolioHeader totalValue={totalValue} />
      <div className="flex items-start gap-[22px] px-10">
        {hasAnyBalance ? (
          <div className="flex flex-1 flex-col gap-10">
            <PublicAssets balances={balances} prices={prices} />
            <ConfidentialAssets />
          </div>
        ) : (
          <EmptyPortfolio />
        )}
        <ActionCenter hasBalance={hasAnyBalance} />
      </div>
    </>
  );
}

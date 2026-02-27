interface PortfolioHeaderProps {
  totalValue?: string;
}

export function PortfolioHeader({ totalValue = "$0.00" }: PortfolioHeaderProps) {
  return (
    <div className="flex items-center gap-[22px] px-10 py-[30px]">
      <div className="flex flex-1 items-center gap-2">
        <h1 className="font-mulish text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-text-heading">
          Portfolio Overview
        </h1>
      </div>

      <div className="shrink-0 rounded-xl border border-surface-border bg-surface px-[17px] py-[9px] backdrop-blur-sm">
        <p className="font-mulish text-[10px] font-bold tracking-[0.5px] text-text-muted text-right">
          Total Value
        </p>
        <p
          className="font-mulish text-sm font-bold text-text-muted text-right"
          aria-live="polite"
        >
          {totalValue}
        </p>
      </div>
    </div>
  );
}

interface PortfolioHeaderProps {
  totalValue?: string;
}

export function PortfolioHeader({ totalValue = "$0.00" }: PortfolioHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-[30px] md:flex-row md:items-center md:gap-[22px] md:px-10">
      <div className="flex items-center gap-2 md:flex-1">
        <h1 className="font-mulish text-2xl font-bold leading-[36px] tracking-[-0.75px] text-text-heading md:text-[30px]">
          Portfolio Overview
        </h1>
      </div>

      <div className="shrink-0 rounded-xl border border-surface-border bg-surface px-4 py-2 backdrop-blur-sm md:px-[17px] md:py-[9px]">
        <p className="font-mulish text-[10px] font-bold tracking-[0.5px] text-text-muted md:text-right">
          Total Value
        </p>
        <p
          className="font-mulish text-sm font-bold text-text-heading md:text-right md:text-text-muted"
          aria-live="polite"
        >
          {totalValue}
        </p>
      </div>
    </div>
  );
}

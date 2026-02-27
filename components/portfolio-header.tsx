interface PortfolioHeaderProps {
  totalValue?: string;
}

export function PortfolioHeader({ totalValue = "$0.00" }: PortfolioHeaderProps) {
  return (
    <div className="flex items-center gap-[22px] px-10 py-[30px]">
      <div className="flex flex-1 items-center gap-2">
        <h1 className="font-mulish text-[30px] font-bold leading-[36px] tracking-[-0.75px] text-white">
          Portfolio Overview
        </h1>
        <button
          className="flex items-center justify-center text-slate-500 cursor-pointer"
          aria-label="Portfolio information"
        >
          <span className="material-icons text-[20px]!">info</span>
        </button>
      </div>

      <div className="shrink-0 rounded-xl border border-white/8 bg-white/3 px-[17px] py-[9px] backdrop-blur-sm">
        <p className="font-mulish text-[10px] font-bold tracking-[0.5px] text-slate-500 text-right">
          Total Value
        </p>
        <p className="font-mulish text-sm font-bold text-white opacity-40 text-right">
          {totalValue}
        </p>
      </div>
    </div>
  );
}

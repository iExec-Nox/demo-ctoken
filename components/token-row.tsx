import Image from "next/image";

interface TokenRowProps {
  name: string;
  symbol: string;
  icon: string;
  formatted: string;
  usdValue?: string;
}

export function TokenRow({
  name,
  symbol,
  icon,
  formatted,
  usdValue,
}: TokenRowProps) {
  return (
    <div className="flex items-center justify-between border-t border-white/8 px-6 py-5">
      <div className="flex items-center gap-6">
        <div className="flex size-8 items-center justify-center rounded-full bg-[#748eff]">
          <Image
            src={icon}
            alt={`${name} icon`}
            width={14}
            height={14}
            className="size-3.5"
          />
        </div>
        <div>
          <p className="font-mulish text-base font-bold leading-6 text-white">
            {name}
          </p>
          <p className="font-mulish text-xs font-medium leading-4 text-slate-500">
            {symbol}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mulish text-lg font-bold leading-7 text-white">
          {formatted} {symbol}
        </p>
        {usdValue && (
          <p className="font-mulish text-sm leading-5 text-slate-500">
            {usdValue}
          </p>
        )}
      </div>
    </div>
  );
}

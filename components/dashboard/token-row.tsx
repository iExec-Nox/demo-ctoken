import Image from 'next/image';

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
    <div className="dark:border-surface-border flex items-center justify-between border-t border-white px-6 py-5">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="bg-primary flex size-8 items-center justify-center rounded-full">
          <Image
            src={icon}
            alt={`${name} icon`}
            width={18}
            height={18}
            className="size-4.5 object-contain"
          />
        </div>
        <div>
          <p className="font-mulish text-text-heading text-base leading-6 font-bold">
            {name}
          </p>
          <p className="font-mulish text-text-body text-xs leading-4 font-medium">
            {symbol}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mulish text-text-heading text-base leading-7 font-bold md:text-lg">
          {formatted} {symbol}
        </p>
        {usdValue && (
          <p className="font-mulish text-text-body text-sm leading-5">
            {usdValue}
          </p>
        )}
      </div>
    </div>
  );
}

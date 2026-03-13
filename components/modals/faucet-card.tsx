import Image from "next/image";

interface FaucetCardProps {
  name: string;
  category: string;
  description: string;
  icon: string;
  mintLabel: string;
  href: string;
}

export function FaucetCard({
  name,
  category,
  description,
  icon,
  mintLabel,
  href,
}: FaucetCardProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-[18px] rounded-2xl border border-surface-border bg-surface px-[30px] py-5">
      <div className="flex size-[35px] items-center justify-center rounded-[10px] bg-primary sm:size-12 sm:rounded-xl">
        <Image src={icon} alt="" width={28} height={28} className="size-5 sm:size-7" />
      </div>

      <p className="text-center font-mulish text-sm font-bold leading-7 text-text-heading sm:text-lg">
        {name}
      </p>

      <p className="text-center font-mulish text-xs font-medium tracking-[0.3px] text-text-muted sm:text-sm">
        {category}
      </p>

      <p className="text-center font-mulish text-xs leading-5 text-text-body sm:text-sm">
        {description}
      </p>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full cursor-pointer rounded-xl bg-primary px-[10px] py-2 text-center font-mulish text-sm font-bold leading-7 text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.2)] hover:bg-primary-hover sm:px-5 sm:py-2.5 sm:text-[15px]"
      >
        {mintLabel}
      </a>
    </div>
  );
}

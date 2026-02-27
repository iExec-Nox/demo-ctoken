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
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
        <Image src={icon} alt="" width={26} height={31} />
      </div>

      <p className="text-center font-mulish text-lg font-bold leading-7 text-text-heading">
        {name}
      </p>

      <p className="text-center font-mulish text-sm font-medium tracking-[0.3px] text-text-muted">
        {category}
      </p>

      <p className="text-center font-mulish text-sm leading-5 text-text-body">
        {description}
      </p>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-center font-mulish text-[15px] font-bold leading-7 text-primary-foreground shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] hover:bg-primary-hover"
      >
        {mintLabel}
      </a>
    </div>
  );
}

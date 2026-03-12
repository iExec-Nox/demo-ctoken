import Image from 'next/image';

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
    <div className="border-surface-border bg-surface flex flex-1 flex-col items-center gap-[18px] rounded-2xl border px-[30px] py-5">
      <div className="bg-primary flex size-[35px] items-center justify-center rounded-[10px] sm:size-12 sm:rounded-xl">
        <Image
          src={icon}
          alt=""
          width={28}
          height={28}
          className="size-5 sm:size-7"
        />
      </div>

      <p className="font-mulish text-text-heading text-center text-sm leading-7 font-bold sm:text-lg">
        {name}
      </p>

      <p className="font-mulish text-text-muted text-center text-xs font-medium tracking-[0.3px] sm:text-sm">
        {category}
      </p>

      <p className="font-mulish text-text-body text-center text-xs leading-5 sm:text-sm">
        {description}
      </p>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary font-mulish text-primary-foreground hover:bg-primary-hover w-full cursor-pointer rounded-xl px-[10px] py-2 text-center text-sm leading-7 font-bold shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] sm:px-5 sm:py-2.5 sm:text-[15px]"
      >
        {mintLabel}
      </a>
    </div>
  );
}

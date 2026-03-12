import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  iconSize?: 'sm' | 'md';
  font?: 'mulish' | 'inter';
}

export function Logo({ iconSize = 'md', font = 'mulish' }: LogoProps) {
  const sizeClass =
    iconSize === 'sm' ? 'size-[22px] md:size-7' : 'size-[26px] md:size-8';
  const fontClass = font === 'inter' ? 'font-inter' : 'font-mulish';

  return (
    <Link href="/" className="flex items-center gap-3 md:gap-[18px]">
      <div
        className={`relative ${sizeClass} bg-primary overflow-hidden rounded-[10px] md:rounded-xl`}
      >
        <Image
          src="/nox-icon.png"
          alt="Nox logo"
          fill
          sizes="32px"
          className="object-cover brightness-0 invert"
        />
      </div>
      <span
        className={`${fontClass} text-logo-text text-sm font-bold tracking-tight md:text-xl`}
      >
        Confidential Token
      </span>
    </Link>
  );
}

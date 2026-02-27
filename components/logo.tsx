import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  iconSize?: "sm" | "md";
  font?: "mulish" | "inter";
}

export function Logo({
  iconSize = "md",
  font = "mulish",
}: LogoProps) {
  const sizeClass = iconSize === "sm" ? "size-7" : "size-8";
  const fontClass = font === "inter" ? "font-inter" : "font-mulish";

  return (
    <Link href="/" className="flex items-center gap-3">
      <div
        className={`relative ${sizeClass} overflow-hidden rounded-xl bg-primary`}
      >
        <Image src="/nox-icon.png" alt="Nox logo" fill sizes="32px" className="object-cover" />
      </div>
      <span
        className={`${fontClass} text-xl font-bold tracking-tight text-logo-text`}
      >
        Confidential Token
      </span>
    </Link>
  );
}

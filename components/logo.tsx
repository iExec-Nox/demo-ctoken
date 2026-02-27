import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  iconSize?: "sm" | "md";
  font?: "mulish" | "inter";
  textColor?: string;
}

export function Logo({
  iconSize = "md",
  font = "mulish",
  textColor = "text-slate-100",
}: LogoProps) {
  const sizeClass = iconSize === "sm" ? "size-7" : "size-8";
  const fontClass = font === "inter" ? "font-inter" : "font-mulish";

  return (
    <Link href="/" className="flex items-center gap-3">
      <div
        className={`relative ${sizeClass} overflow-hidden rounded-xl bg-[#748eff]`}
      >
        <Image src="/nox-icon.png" alt="Nox logo" fill className="object-cover" />
      </div>
      <span
        className={`${fontClass} text-xl font-bold tracking-tight ${textColor}`}
      >
        Confidential Token
      </span>
    </Link>
  );
}

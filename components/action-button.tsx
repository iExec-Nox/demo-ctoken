import Link from "next/link";

interface ActionButtonProps {
  icon: string;
  label: string;
  description: string;
  disabled?: boolean;
  href: string;
}

const sharedClasses =
  "flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-slate-800/50 p-4";

export function ActionButton({
  icon,
  label,
  description,
  disabled = false,
  href,
}: ActionButtonProps) {
  const content = (
    <>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-700/50">
        <span className="material-icons text-[24px]! text-slate-400">
          {icon}
        </span>
      </div>
      <div className="text-left">
        <p className="font-mulish text-base font-bold leading-6 text-slate-400">
          {label}
        </p>
        <p className="font-mulish text-[10px] leading-[15px] text-slate-400">
          {description}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        className={`${sharedClasses} cursor-not-allowed opacity-30`}
        role="link"
        aria-disabled="true"
        aria-label={`${label} — ${description}`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${sharedClasses} cursor-pointer hover:border-white/10 hover:bg-slate-800/70`}
    >
      {content}
    </Link>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ActionButton({
  icon,
  label,
  description,
  disabled = false,
  onClick,
}: ActionButtonProps) {
  const content = (
    <>
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          disabled ? "bg-asset-icon-bg" : "bg-primary"
        }`}
      >
        <span
          className={`material-icons text-[24px]! ${
            disabled ? "text-text-muted" : "text-primary-foreground"
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="text-left">
        <p
          className={`font-mulish text-base font-bold leading-6 ${
            disabled ? "text-text-muted" : "text-text-heading"
          }`}
        >
          {label}
        </p>
        <p
          className={`font-mulish text-[10px] leading-[15px] ${
            disabled ? "text-text-muted" : "text-text-heading"
          }`}
        >
          {description}
        </p>
      </div>
    </>
  );

  if (disabled) {
    return (
      <div
        className="flex w-full items-center gap-4 rounded-2xl border border-surface-border bg-surface p-4 cursor-not-allowed opacity-30"
        role="button"
        aria-disabled="true"
        aria-label={`${label} — ${description}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-action-btn-active-border bg-action-btn-active-bg p-4 cursor-pointer transition-opacity hover:opacity-80"
      aria-label={`${label} — ${description}`}
    >
      {content}
    </button>
  );
}

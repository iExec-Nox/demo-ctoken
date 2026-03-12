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
        className={`flex size-[30px] shrink-0 items-center justify-center rounded-[10px] md:size-10 md:rounded-xl ${
          disabled ? 'bg-asset-icon-bg' : 'bg-primary'
        }`}
      >
        <span
          className={`material-icons text-[20px]! md:text-[24px]! ${
            disabled ? 'text-text-muted' : 'text-primary-foreground'
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="text-left">
        <p
          className={`font-mulish text-sm leading-6 font-bold md:text-base ${
            disabled ? 'text-text-muted' : 'dark:text-text-heading text-white'
          }`}
        >
          {label}
        </p>
        <p
          className={`font-mulish text-[10px] leading-[15px] ${
            disabled ? 'text-text-muted' : 'dark:text-text-heading text-white'
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
        className="border-surface-border bg-surface flex w-full cursor-not-allowed items-center gap-4 rounded-2xl border p-4 opacity-30"
        role="button"
        tabIndex={-1}
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
      className="dark:border-action-btn-active-border dark:bg-action-btn-active-bg flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[rgba(116,142,255,0.68)] p-4 transition-opacity hover:opacity-80"
      aria-label={`${label} — ${description}`}
    >
      {content}
    </button>
  );
}

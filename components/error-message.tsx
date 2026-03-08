interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
  icon?: string;
}

export function ErrorMessage({ error, onRetry, icon = "error" }: ErrorMessageProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-tx-error-text/30 bg-tx-error-bg px-4 py-3">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="material-icons text-[18px]! text-tx-error-text">
          {icon}
        </span>
        <p className="min-w-0 flex-1 font-mulish text-xs text-tx-error-text">
          {error}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer self-end font-mulish text-xs font-bold text-tx-error-text underline"
      >
        Retry
      </button>
    </div>
  );
}

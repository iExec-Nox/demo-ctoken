interface ErrorMessageProps {
  error: string;
  onRetry: () => void;
  icon?: string;
}

export function ErrorMessage({
  error,
  onRetry,
  icon = 'error',
}: ErrorMessageProps) {
  return (
    <div className="border-tx-error-text/30 bg-tx-error-bg flex flex-col gap-2 rounded-xl border px-4 py-3">
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="material-icons text-tx-error-text text-[18px]!"
        >
          {icon}
        </span>
        <p className="font-mulish text-tx-error-text min-w-0 flex-1 text-xs">
          {error}
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="font-mulish text-tx-error-text cursor-pointer self-end text-xs font-bold underline"
      >
        Retry
      </button>
    </div>
  );
}

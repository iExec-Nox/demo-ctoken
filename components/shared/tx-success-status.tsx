import { ArbiscanLink } from './arbiscan-link';

interface TxSuccessStatusProps {
  message: string;
  txHash: string;
}

export function TxSuccessStatus({ message, txHash }: TxSuccessStatusProps) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-2"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="bg-tx-success-text size-3 rounded-full opacity-70" />
        <span className="font-mulish text-text-body text-sm font-medium">
          {message}
        </span>
      </div>
      <ArbiscanLink
        txHash={txHash}
        label="View on Arbiscan"
        className="text-xs"
      />
    </div>
  );
}

import { ArbiscanLink } from "./arbiscan-link";

interface TxSuccessStatusProps {
  message: string;
  txHash: string;
}

export function TxSuccessStatus({ message, txHash }: TxSuccessStatusProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-2" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="size-3 rounded-full bg-tx-success-text opacity-70" />
        <span className="font-mulish text-sm font-medium text-text-body">
          {message}
        </span>
      </div>
      <ArbiscanLink txHash={txHash} label="View on Arbiscan" className="text-xs" />
    </div>
  );
}

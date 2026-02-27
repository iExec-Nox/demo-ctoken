const BASE_URL = "https://sepolia.arbiscan.io/tx";

interface ArbiscanLinkProps {
  txHash: string;
  label?: string;
  className?: string;
}

export function ArbiscanLink({
  txHash,
  label = "View on Arbiscan",
  className,
}: ArbiscanLinkProps) {
  return (
    <a
      href={`${BASE_URL}/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mulish text-sm font-medium text-primary hover:underline ${className ?? ""}`}
    >
      {label}
      <span className="material-icons text-[14px]!">open_in_new</span>
    </a>
  );
}

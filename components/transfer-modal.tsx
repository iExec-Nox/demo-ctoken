"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTransferModal } from "./transfer-modal-provider";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useDevMode } from "@/hooks/use-dev-mode";
import { DevModeToggle } from "./dev-mode-toggle";
import { ArbiscanLink } from "./arbiscan-link";
import { confidentialTokens } from "@/lib/tokens";

const TRANSFER_CODE = `function confidentialTransfer(
  address to,
  externalEuint256 encryptedAmount,
  bytes calldata inputProof
) public virtual returns (euint256) {
    // decrypt and verify the user-provided encrypted amount
    return _transfer(msg.sender, to,
      Nox.fromExternal(encryptedAmount, inputProof));
}`;

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function truncateAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TransferModal() {
  const { open, setOpen } = useTransferModal();
  const { balances } = useTokenBalances();
  const { enabled: devMode } = useDevMode();
  const [selectedSymbol, setSelectedSymbol] = useState(confidentialTokens[0]?.symbol ?? "cUSDC");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Map confidential tokens with balances (using base token balance for now)
  const transferableTokens = confidentialTokens.map((ct) => {
    const baseSymbol = ct.symbol.replace(/^c/, "");
    const bal = balances.find((b) => b.symbol === baseSymbol);
    return {
      symbol: ct.symbol,
      icon: ct.icon,
      decimals: ct.decimals,
      balance: bal?.balance ?? 0n,
      formatted: bal?.formatted ?? "0",
    };
  });

  const selectedToken = transferableTokens.find((t) => t.symbol === selectedSymbol) ?? transferableTokens[0];

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setAmount("");
      setRecipient("");
      setDropdownOpen(false);
      setCopied(false);
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  const handleAmountChange = useCallback((value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handleSelectToken = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setAmount("");
    setDropdownOpen(false);
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(TRANSFER_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Validation
  const parsedAmount = parseFloat(amount) || 0;
  const maxAmount = parseFloat(selectedToken?.formatted ?? "0") || 0;
  const isOverBalance = parsedAmount > maxAmount;
  const isValidAmount = parsedAmount > 0 && !isOverBalance;
  const addressValid = isValidAddress(recipient);
  const canTransfer = isValidAmount && addressValid;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] max-w-[calc(100%-2rem)] gap-2.5 overflow-y-auto overflow-x-hidden rounded-[32px] border-modal-border bg-modal-bg px-6 py-[26px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 md:px-10 sm:max-w-[552px]"
        showCloseButton={false}
      >
        {/* Top bar: Dev mode toggle (left) + Close button (right) */}
        <div className="flex w-full items-center justify-between">
          <DevModeToggle label="Dev Mode" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer font-mulish text-xl text-text-heading transition-opacity hover:opacity-70"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex min-w-0 w-full flex-col items-center gap-[26px]">
          {/* Header */}
          <div className="text-center">
            <DialogTitle className="font-mulish text-2xl font-bold leading-10 tracking-[-0.9px] text-text-heading md:text-[36px]">
              Confidential Transfer
            </DialogTitle>
            <DialogDescription className="mt-3 font-mulish text-base leading-6 text-text-body">
              Transactions are encrypted and private by default.
            </DialogDescription>
          </div>

          {/* Glass card */}
          <div className="flex w-full flex-col gap-[26px] rounded-3xl border border-surface-border bg-surface px-5 py-[15px] backdrop-blur-sm">
            {/* Amount section */}
            <div className="flex flex-col gap-4">
              {/* Label */}
              <span className="pl-1 font-inter text-xs font-bold tracking-[1.2px] text-text-muted">
                Amount
              </span>

              {/* Input area */}
              <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface px-4 py-[17px]">
                {/* Token selector */}
                <div className="relative">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-surface-border bg-surface px-3 py-2.5 transition-opacity hover:opacity-80"
                    aria-label="Select token"
                    aria-expanded={dropdownOpen}
                  >
                    {selectedToken && (
                      <Image
                        src={selectedToken.icon}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6"
                      />
                    )}
                    <span className="font-mulish text-sm font-bold text-text-heading md:text-base">
                      {selectedToken?.symbol}
                    </span>
                    <span aria-hidden="true" className="material-icons text-[16px]! text-text-body md:text-[18px]!">
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      role="listbox"
                      aria-label="Select token"
                      className="absolute left-0 top-full z-50 mt-1 min-w-[180px] origin-top-left animate-[dropdown-in_150ms_ease-out] motion-reduce:animate-none rounded-xl border border-surface-border bg-modal-bg p-2 shadow-lg"
                    >
                      {transferableTokens.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => handleSelectToken(token.symbol)}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface ${
                            token.symbol === selectedSymbol ? "bg-surface" : ""
                          }`}
                        >
                          <Image
                            src={token.icon}
                            alt=""
                            width={24}
                            height={24}
                            className="size-6"
                          />
                          <span className="font-mulish text-sm font-bold text-text-heading">
                            {token.symbol}
                          </span>
                          <span className="ml-auto font-mulish text-xs text-text-body">
                            {token.formatted}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount input */}
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`min-w-0 flex-1 bg-transparent text-right font-mulish text-2xl font-bold leading-8 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary/50 placeholder:text-text-muted/60 ${
                    isOverBalance ? "text-tx-error-text" : "text-text-heading"
                  }`}
                  aria-label="Amount"
                  aria-invalid={isOverBalance}
                  aria-describedby={isOverBalance ? "transfer-balance-error" : undefined}
                />
              </div>
              {isOverBalance && (
                <p id="transfer-balance-error" className="pl-1 font-mulish text-xs text-tx-error-text">
                  Insufficient balance
                </p>
              )}
            </div>

            {/* Recipient address section */}
            <div className="flex flex-col gap-4">
              {/* Label */}
              <span className="pl-1 font-mulish text-xs font-bold tracking-[1.2px] text-text-muted">
                Recipient Address
              </span>

              {/* Address input */}
              <div className="px-2.5 py-3">
                <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-surface px-[17px] py-[7px]">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-mulish text-sm text-text-heading outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary/50 placeholder:text-text-muted"
                    aria-label="Recipient address"
                  />
                  {recipient.length > 0 && (
                    <span
                      aria-label={addressValid ? "Valid address" : "Invalid address"}
                      className={`material-icons text-[24px]! ${
                        addressValid ? "text-tx-success-text" : "text-tx-error-text"
                      }`}
                    >
                      {addressValid ? "check_circle" : "cancel"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction info summary */}
            <div className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-[21px] text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-body">Recipient</span>
                <span className="flex items-center gap-1 font-mulish text-[10px] font-medium text-text-heading md:text-sm">
                  <span aria-hidden="true" className="material-icons text-[12px]! text-primary">
                    enhanced_encryption
                  </span>
                  {recipient && addressValid ? truncateAddress(recipient) : "Encrypted Hash"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-body">Token</span>
                <span className="font-mulish text-[10px] font-medium text-text-heading md:text-sm">
                  {selectedToken?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-body">Network Fee</span>
                <span className="font-mulish text-[10px] font-medium text-text-heading md:text-sm">
                  ~0.0004 ETH
                </span>
              </div>
            </div>

            {/* How it works */}
            <div className="flex gap-4 rounded-2xl border border-surface-border bg-surface px-3 py-2.5 backdrop-blur-sm md:p-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary md:size-10">
                <span aria-hidden="true" className="material-icons text-[14px]! text-primary-foreground md:text-[24px]!">
                  info
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mulish text-sm font-bold text-text-heading">How it works</p>
                <p className="mt-1 font-mulish text-xs leading-[19.5px] text-text-body">
                  Amounts are encrypted.
                  <br />
                  The transfer is verified on-chain without revealing values.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex justify-center">
              <button
                type="button"
                disabled={!canTransfer}
                className="flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 md:w-[181px] md:px-[18px] md:py-3"
              >
                <span className="font-mulish text-sm font-bold text-primary-foreground md:text-base">
                  Transfer
                </span>
              </button>
            </div>
          </div>

          {/* Progress tracker */}
          <div className="flex w-full flex-col items-center gap-3 md:flex-row md:items-start md:gap-0" role="status" aria-live="polite">
            {/* Step 1: Approve — done */}
            <div className="w-[136px] md:w-auto md:flex-1">
              <div className="h-1 w-full rounded-full bg-tx-success-text/30">
                <div className="h-1 w-full rounded-full bg-tx-success-text" />
              </div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <span aria-hidden="true" className="material-icons text-[16px]! text-tx-success-text">
                  check_circle
                </span>
                <span className="font-mulish text-[10px] font-bold tracking-[1px] text-tx-success-text">
                  Approve
                </span>
              </div>
            </div>

            {/* Step 2: Transfer — in progress */}
            <div className="w-[136px] md:w-auto md:flex-1">
              <div className="h-1 w-full rounded-full bg-surface-border">
                <div className="h-1 w-1/3 rounded-full bg-primary" />
              </div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <span aria-hidden="true" className="material-icons text-[16px]! text-primary">
                  sync
                </span>
                <span className="font-mulish text-[10px] font-bold tracking-[1px] text-primary">
                  Transfer
                </span>
              </div>
            </div>

            {/* Step 3: Confirmed — pending */}
            <div className="w-[136px] md:w-auto md:flex-1">
              <div className="h-1 w-full rounded-full bg-surface-border" />
              <div className="mt-2 flex items-center justify-center gap-1">
                <span aria-hidden="true" className="material-icons text-[16px]! text-text-muted">
                  verified
                </span>
                <span className="font-mulish text-[10px] font-bold tracking-[1px] text-text-muted">
                  Confirmed
                </span>
              </div>
            </div>
          </div>

          {/* Function called (dev mode only) */}
          {devMode && (
            <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-surface-border bg-surface px-5 py-3 backdrop-blur-sm md:px-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary">
                    <span aria-hidden="true" className="material-icons text-[24px]! text-primary-foreground">
                      code
                    </span>
                  </div>
                  <span className="font-mulish text-sm font-bold text-text-heading">
                    Function called
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-surface-border/50"
                  aria-label="Copy code"
                >
                  <span aria-hidden="true" className="material-icons text-[18px]! text-text-muted transition-colors">
                    {copied ? "check" : "content_copy"}
                  </span>
                </button>
              </div>
              <pre className="overflow-x-auto font-mono text-xs leading-[19.5px] text-code-text">
                {TRANSFER_CODE}
              </pre>
            </div>
          )}

          {/* Transfer complete status + Arbiscan link */}
          <div className="flex flex-col items-center gap-1 py-2" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-tx-success-text opacity-70" />
              <span className="font-mulish text-sm font-medium text-text-body">
                Confidential Transfer Complete
              </span>
            </div>
            <ArbiscanLink
              txHash="0x..."
              label="View on Arbiscan"
              className="text-xs"
            />
          </div>
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-1 w-full cursor-pointer text-center font-inter text-[15px] font-medium text-text-muted transition-opacity hover:opacity-70"
        >
          Cancel
        </button>
      </DialogContent>
    </Dialog>
  );
}

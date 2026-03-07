"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWrapModal } from "./wrap-modal-provider";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useDevMode } from "@/hooks/use-dev-mode";
import { useWrap, type WrapStep } from "@/hooks/use-wrap";
import { useUnwrap, type UnwrapStep } from "@/hooks/use-unwrap";
import { useConfidentialBalances } from "@/hooks/use-confidential-balances";
import { useHandleClient } from "@/hooks/use-handle-client";
import { wrappableTokens as wrappableTokenConfigs } from "@/lib/tokens";
import { ArbiscanLink } from "./arbiscan-link";
import { useEstimatedFee } from "@/hooks/use-estimated-fee";
import { formatUnits } from "viem";

const WRAP_CODE = `function wrap(address to, uint256 amount) public virtual override returns (euint256) {
    // take ownership of the underlying tokens
    SafeERC20.safeTransferFrom(IERC20(underlying()), msg.sender, address(this), amount - (amount % rate()));

    // mint confidential tokens to recipient
    euint256 wrappedAmountSent = _mint(to, Nox.toEuint256(amount / rate()));
    Nox.allowTransient(wrappedAmountSent, msg.sender);
    return wrappedAmountSent;
}`;

const UNWRAP_CODE = `// Step 1: Initiate unwrap with encrypted amount
function unwrap(
    address from, address to,
    bytes32 encryptedAmount, bytes inputProof
) external;

// Step 2: Finalize unwrap with cleartext amount
function finalizeUnwrap(
    bytes32 handle,
    uint256 clearAmount,
    bytes decryptionProof
) external;`;

function WrapProgressTracker({ step }: { step: WrapStep }) {
  const approveState =
    step === "approving"
      ? "active"
      : step === "wrapping" || step === "confirmed"
        ? "done"
        : step === "error"
          ? "pending"
          : "pending";

  const wrapState =
    step === "wrapping"
      ? "active"
      : step === "confirmed"
        ? "done"
        : "pending";

  const confirmedState = step === "confirmed" ? "done" : "pending";

  return (
    <div
      className="flex w-full flex-col items-center gap-3 md:flex-row md:items-start md:gap-0"
      role="status"
      aria-live="polite"
    >
      <StepIndicator state={approveState} icon="check_circle" label="Approve" />
      <StepIndicator state={wrapState} icon="sync" label="Wrap" />
      <StepIndicator state={confirmedState} icon="verified" label="Confirmed" />
    </div>
  );
}

function UnwrapProgressTracker({ step }: { step: UnwrapStep }) {
  const STEPS: UnwrapStep[] = ["encrypting", "unwrapping", "finalizing", "confirmed"];

  function stateFor(target: UnwrapStep): "pending" | "active" | "done" {
    if (step === "idle" || step === "error") return "pending";
    const current = STEPS.indexOf(step);
    const idx = STEPS.indexOf(target);
    if (current > idx) return "done";
    if (current === idx) return target === "confirmed" ? "done" : "active";
    return "pending";
  }

  return (
    <div
      className="flex w-full flex-col items-center gap-3 md:flex-row md:items-start md:gap-0"
      role="status"
      aria-live="polite"
    >
      <StepIndicator state={stateFor("encrypting")} icon="lock" label="Encrypt" />
      <StepIndicator state={stateFor("unwrapping")} icon="sync" label="Unwrap" />
      <StepIndicator state={stateFor("finalizing")} icon="check_circle" label="Finalize" />
      <StepIndicator state={stateFor("confirmed")} icon="verified" label="Confirmed" />
    </div>
  );
}

function StepIndicator({
  state,
  icon,
  label,
}: {
  state: "pending" | "active" | "done";
  icon: string;
  label: string;
}) {
  const barColor =
    state === "done"
      ? "bg-tx-success-text"
      : state === "active"
        ? "bg-primary"
        : "bg-surface-border";
  const barWidth = state === "done" ? "w-full" : state === "active" ? "w-1/2" : "w-0";
  const iconColor =
    state === "done"
      ? "text-tx-success-text"
      : state === "active"
        ? "text-primary"
        : "text-text-muted";
  const textColor = iconColor;
  const displayIcon = state === "done" ? "check_circle" : icon;

  return (
    <div className="w-[136px] md:w-auto md:flex-1">
      <div className="h-1 w-full rounded-full bg-surface-border">
        <div
          className={`h-1 rounded-full transition-all duration-500 ${barColor} ${barWidth}`}
        />
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <span
          aria-hidden="true"
          className={`material-icons text-[16px]! ${iconColor} ${state === "active" ? "animate-spin motion-reduce:animate-none" : ""}`}
        >
          {displayIcon}
        </span>
        <span
          className={`font-mulish text-[10px] font-bold tracking-[1px] ${textColor}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export function WrapModal() {
  const { open, setOpen, activeTab, setActiveTab } = useWrapModal();
  const { balances } = useTokenBalances();
  const { enabled: devMode } = useDevMode();
  const { step: wrapStep, error: wrapError, wrapTxHash, wrap, reset: resetWrap } = useWrap();
  const { step: unwrapStep, error: unwrapError, isFinalizeError, finalizeTxHash, unwrap, retryFinalize, reset: resetUnwrap } = useUnwrap();
  const { balances: confidentialBalances } = useConfidentialBalances();
  const { handleClient } = useHandleClient();
  const [decryptedAmounts, setDecryptedAmounts] = useState<Record<string, string>>({});
  const [decryptingSymbol, setDecryptingSymbol] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("RLC");
  const [amount, setAmount] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isWrap = activeTab === "wrap";
  // Gas limits: wrap (approve + wrap) ~150k, unwrap (encrypt + unwrap + finalize) ~300k
  const { fee: estimatedFee } = useEstimatedFee(isWrap ? 150_000n : 300_000n);
  const isWrapProcessing = wrapStep === "approving" || wrapStep === "wrapping";
  const isUnwrapProcessing = unwrapStep === "encrypting" || unwrapStep === "unwrapping" || unwrapStep === "finalizing";
  const isProcessing = isWrap ? isWrapProcessing : isUnwrapProcessing;
  const currentError = isWrap ? wrapError : unwrapError;

  // Map wrappable tokens with balances
  const wrappableTokens = wrappableTokenConfigs.map((t) => {
    const bal = balances.find((b) => b.symbol === t.symbol);
    return {
      symbol: t.symbol,
      icon: t.icon,
      decimals: t.decimals,
      balance: bal?.balance ?? 0n,
      formatted: bal?.formatted ?? "0",
    };
  });

  const selectedToken = wrappableTokens.find((t) => t.symbol === selectedSymbol) ?? wrappableTokens[0];

  // Reset amount and state when modal opens or tab changes
  useEffect(() => {
    if (open) {
      setAmount("");
      setDropdownOpen(false);
      resetWrap();
      resetUnwrap();
    }
  }, [open, activeTab, resetWrap, resetUnwrap]);

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

  const handleAmountChange = useCallback(
    (value: string) => {
      // Allow empty, or valid decimal numbers
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setAmount(value);
      }
    },
    []
  );

  const handleMax = useCallback(() => {
    if (isWrap) {
      if (selectedToken) setAmount(selectedToken.formatted);
    } else {
      const decrypted = decryptedAmounts[selectedSymbol];
      if (decrypted) setAmount(decrypted);
    }
  }, [isWrap, selectedToken, decryptedAmounts, selectedSymbol]);

  const handleSelectToken = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setAmount("");
    setDropdownOpen(false);
  }, []);

  // Decrypt a confidential balance inline
  const handleDecryptBalance = useCallback(
    async (symbol: string) => {
      if (!handleClient || decryptingSymbol) return;
      const cBalance = confidentialBalances.find((b) => b.symbol === `c${symbol}`);
      if (!cBalance || !cBalance.isInitialized) return;

      setDecryptingSymbol(symbol);
      try {
        const { value } = await handleClient.decrypt(cBalance.handle);
        const formatted = formatUnits(
          typeof value === "bigint" ? value : BigInt(String(value)),
          cBalance.decimals,
        );
        setDecryptedAmounts((prev) => ({ ...prev, [symbol]: formatted }));
      } catch {
        // Decrypt failed silently — user can retry
      } finally {
        setDecryptingSymbol(null);
      }
    },
    [handleClient, decryptingSymbol, confidentialBalances],
  );

  // Get the confidential balance display for a token (unwrap mode)
  const getConfidentialDisplay = useCallback(
    (symbol: string) => {
      const decrypted = decryptedAmounts[symbol];
      if (decrypted !== undefined) return decrypted;
      const cBalance = confidentialBalances.find((b) => b.symbol === `c${symbol}`);
      if (!cBalance?.isInitialized) return "0";
      return null; // null = encrypted, needs decrypt
    },
    [decryptedAmounts, confidentialBalances],
  );

  // Find the original token config for the wrap hook
  const selectedTokenConfig = wrappableTokenConfigs.find(
    (t) => t.symbol === selectedSymbol
  );

  const handleWrap = useCallback(async () => {
    if (!selectedTokenConfig || !amount) return;
    await wrap(selectedTokenConfig, amount);
  }, [selectedTokenConfig, amount, wrap]);

  const handleUnwrap = useCallback(async () => {
    if (!selectedTokenConfig || !amount) return;
    await unwrap(selectedTokenConfig, amount);
  }, [selectedTokenConfig, amount, unwrap]);

  // Validation
  const parsedAmount = parseFloat(amount) || 0;
  const hasDecryptedBalance = !isWrap && decryptedAmounts[selectedSymbol] !== undefined;
  const maxAmountStr = isWrap
    ? (selectedToken?.formatted ?? "0")
    : (decryptedAmounts[selectedSymbol] ?? "0");
  const maxAmount = parseFloat(maxAmountStr) || 0;
  // Only check over-balance if we know the balance (wrap always, unwrap only if decrypted)
  const isOverBalance = (isWrap || hasDecryptedBalance) && parsedAmount > maxAmount;
  const isValidAmount = parsedAmount > 0 && !isOverBalance;

  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    const code = activeTab === "wrap" ? WRAP_CODE : UNWRAP_CODE;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeTab]);

  const cTokenSymbol = `c${selectedToken?.symbol ?? "USDC"}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] max-w-[calc(100%-2rem)] gap-2.5 overflow-y-auto overflow-x-hidden rounded-[40px] border-modal-border bg-modal-bg px-6 py-[26px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 md:px-10 sm:max-w-[552px]"
        showCloseButton={false}
      >
        {/* Close button */}
        <div className="flex w-full items-center justify-end">
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
            <DialogTitle className="font-mulish text-[26px] font-bold leading-10 text-text-heading md:text-[34px]">
              Convert Assets
            </DialogTitle>
            <DialogDescription className="mt-2 font-mulish text-sm leading-6 text-text-body md:text-base">
              {isWrap ? "Make your assets confidential" : "Return your assets to public"}
            </DialogDescription>
          </div>

          {/* Glass card */}
          <div className="flex w-full flex-col gap-[26px] rounded-[32px] border border-surface-border bg-surface p-5 backdrop-blur-sm md:px-10 md:py-5">
            {/* Tabs */}
            <div className="flex items-start justify-between">
              <button
                type="button"
                onClick={() => setActiveTab("wrap")}
                className={`flex w-[48%] cursor-pointer items-center justify-center rounded-2xl py-3.5 font-mulish text-sm font-bold transition-colors ${
                  isWrap
                    ? "border border-surface-border bg-surface text-text-heading"
                    : "text-text-muted hover:text-text-body"
                }`}
              >
                Wrap
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unwrap")}
                className={`flex w-[48%] cursor-pointer items-center justify-center rounded-2xl py-3.5 font-mulish text-sm font-bold transition-colors ${
                  !isWrap
                    ? "border border-surface-border bg-surface text-text-heading"
                    : "text-text-muted hover:text-text-body"
                }`}
              >
                Unwrap
              </button>
            </div>

            {/* Amount label + balance */}
            <div className="flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between md:gap-0">
              <span className="font-mulish font-bold tracking-[1.2px] text-text-muted">
                {isWrap ? "Amount to Wrap" : "Amount to Unwrap"}
              </span>
              <div className="flex items-center gap-1.5 font-mulish">
                <span className="text-text-body">
                  {isWrap ? "Public Asset :" : "Confidential Asset :"}
                </span>
                {isWrap ? (
                  <span className="text-text-heading">
                    {selectedToken ? `${selectedToken.formatted} ${selectedToken.symbol}` : "0"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-text-heading">
                    {(() => {
                      const display = getConfidentialDisplay(selectedSymbol);
                      if (display === null) {
                        return (
                          <>
                            <span>****** {cTokenSymbol}</span>
                            {decryptingSymbol === selectedSymbol ? (
                              <span className="material-icons animate-spin motion-reduce:animate-none text-[12px]! text-text-muted">sync</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDecryptBalance(selectedSymbol)}
                                className="cursor-pointer transition-opacity hover:opacity-70"
                                aria-label="Reveal balance"
                              >
                                <span className="material-icons text-[12px]! text-primary">visibility</span>
                              </button>
                            )}
                          </>
                        );
                      }
                      return `${display} ${cTokenSymbol}`;
                    })()}
                  </span>
                )}
              </div>
            </div>

            {/* Input area */}
            <div className="flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface px-5 py-[17px]">
              <div className="flex items-center justify-between">
                {/* Token selector */}
                <div className="relative">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1.5 transition-opacity hover:opacity-80"
                    aria-label="Select token"
                    aria-expanded={dropdownOpen}
                  >
                    {selectedToken && (
                      <Image
                        src={selectedToken.icon}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5"
                      />
                    )}
                    <span className="font-mulish text-sm font-bold text-text-heading">
                      {isWrap ? selectedToken?.symbol : cTokenSymbol}
                    </span>
                    <span aria-hidden="true" className="material-icons text-[14px]! text-text-body">
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      role="listbox"
                      aria-label="Select token"
                      className={`absolute left-0 top-full z-50 mt-1 origin-top-left animate-[dropdown-in_150ms_ease-out] motion-reduce:animate-none rounded-xl border border-surface-border bg-modal-bg p-2 shadow-lg ${
                        isWrap ? "min-w-[160px]" : "min-w-[220px]"
                      }`}
                    >
                      {wrappableTokens.map((token) => {
                        const confidentialDisplay = getConfidentialDisplay(token.symbol);
                        return (
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
                              width={20}
                              height={20}
                              className="size-5"
                            />
                            <span className="font-mulish text-sm font-bold text-text-heading">
                              {isWrap ? token.symbol : `c${token.symbol}`}
                            </span>
                            {isWrap ? (
                              <span className="ml-auto font-mulish text-xs text-text-body">
                                {token.formatted}
                              </span>
                            ) : (
                              <span className="ml-auto flex items-center gap-1.5 font-mulish text-xs text-text-body">
                                {confidentialDisplay === null ? (
                                  <>
                                    <span>******</span>
                                    {decryptingSymbol === token.symbol ? (
                                      <span className="material-icons animate-spin motion-reduce:animate-none text-[12px]! text-text-muted">sync</span>
                                    ) : (
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDecryptBalance(token.symbol);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleDecryptBalance(token.symbol);
                                          }
                                        }}
                                        className="cursor-pointer transition-opacity hover:opacity-70"
                                        aria-label={`Reveal ${token.symbol} balance`}
                                      >
                                        <span className="material-icons text-[14px]! text-primary">visibility</span>
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span>{confidentialDisplay}</span>
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })}
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
                  className={`min-w-0 flex-1 bg-transparent text-right font-mulish text-2xl font-bold leading-9 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded placeholder:text-text-muted md:text-[30px] ${
                    isOverBalance ? "text-tx-error-text" : "text-text-heading"
                  }`}
                  aria-label="Amount"
                  aria-invalid={isOverBalance}
                  aria-describedby={isOverBalance ? "wrap-balance-error" : undefined}
                />
              </div>
              {isOverBalance && (
                <p id="wrap-balance-error" className="pl-1 font-mulish text-xs text-tx-error-text">
                  Insufficient balance
                </p>
              )}

              {/* Network + MAX */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mulish text-text-muted">Arbitrum Sepolia</span>
                <button
                  type="button"
                  onClick={handleMax}
                  className="cursor-pointer font-mulish font-bold text-primary transition-opacity hover:opacity-80"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Transaction details */}
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-muted">You will receive</span>
                <span className="font-mulish font-medium text-text-heading">
                  {isWrap ? `1:1 ${cTokenSymbol}` : `1:1 ${selectedToken?.symbol}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-muted">Estimated Gas Fee</span>
                <span className="font-mulish text-text-body">{estimatedFee ?? "..."} ETH</span>
              </div>
            </div>

            {/* Error message */}
            {currentError && (
              <div className="flex flex-col gap-2 rounded-xl border border-tx-error-text/30 bg-tx-error-bg px-4 py-3">
                <div className="flex items-start gap-2">
                  <span aria-hidden="true" className="material-icons text-[18px]! text-tx-error-text">
                    {isFinalizeError ? "warning" : "error"}
                  </span>
                  <p className="min-w-0 flex-1 font-mulish text-xs text-tx-error-text">
                    {isFinalizeError
                      ? "Your tokens have been unwrapped but the finalization failed. Your tokens are in transit — click below to retry and recover them."
                      : currentError}
                  </p>
                </div>
                {isFinalizeError ? (
                  <button
                    type="button"
                    onClick={retryFinalize}
                    className="cursor-pointer self-end rounded-lg bg-tx-error-text px-4 py-1.5 font-mulish text-xs font-bold text-primary-foreground transition-opacity hover:opacity-80"
                  >
                    Retry Finalize
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={isWrap ? resetWrap : resetUnwrap}
                    className="cursor-pointer self-end font-mulish text-xs font-bold text-tx-error-text underline"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              disabled={!isValidAmount || isProcessing}
              onClick={isWrap ? handleWrap : handleUnwrap}
              className="mx-auto flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 md:w-[215px] md:px-5 md:py-3"
            >
              {isProcessing ? (
                <>
                  <span aria-hidden="true" className="material-icons animate-spin motion-reduce:animate-none text-[16px]! text-primary-foreground md:text-[20px]!">
                    sync
                  </span>
                  <span className="font-mulish text-sm font-bold text-primary-foreground md:text-lg">
                    {isWrap
                      ? (wrapStep === "approving" ? "Approving..." : "Wrapping...")
                      : (unwrapStep === "encrypting" ? "Encrypting..." : unwrapStep === "unwrapping" ? "Unwrapping..." : "Finalizing...")}
                  </span>
                </>
              ) : (isWrap ? wrapStep : unwrapStep) === "confirmed" ? (
                <>
                  <span aria-hidden="true" className="material-icons text-[16px]! text-primary-foreground md:text-[20px]!">
                    check_circle
                  </span>
                  <span className="font-mulish text-sm font-bold text-primary-foreground md:text-lg">
                    {isWrap ? "Wrapped!" : "Unwrapped!"}
                  </span>
                </>
              ) : (
                <>
                  <span aria-hidden="true" className="material-icons text-[16px]! text-primary-foreground md:text-[20px]!">
                    account_balance_wallet
                  </span>
                  <span className="font-mulish text-sm font-bold text-primary-foreground md:text-lg">
                    {isWrap ? "Wrap Assets" : "Unwrap Assets"}
                  </span>
                </>
              )}
            </button>

            {/* How it works */}
            <div className="flex w-full gap-4 rounded-2xl border border-surface-border bg-surface px-3 py-2.5 backdrop-blur-sm md:p-6">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary md:size-10">
                <span aria-hidden="true" className="material-icons text-[14px]! text-primary-foreground md:text-[24px]!">
                  info
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mulish text-sm font-bold text-text-heading">How it works</p>
                <p className="mt-1 font-mulish text-xs leading-[19.5px] text-text-body">
                  {isWrap
                    ? "Wrapping moves your tokens from the public Arbitrum ledger into Confidential Token's private vault. Once wrapped, your balance and transfers are only visible to you."
                    : "Unwrapping moves your confidential tokens back to the public Arbitrum ledger. Once unwrapped, your balance and transfers are visible on-chain."}
                </p>
              </div>
            </div>
          </div>

          {/* Progress tracker */}
          {isWrap ? (
            <WrapProgressTracker step={wrapStep} />
          ) : (
            <UnwrapProgressTracker step={unwrapStep} />
          )}

          {/* Arbiscan link on success */}
          {isWrap && wrapStep === "confirmed" && wrapTxHash && (
            <ArbiscanLink txHash={wrapTxHash} />
          )}
          {!isWrap && unwrapStep === "confirmed" && finalizeTxHash && (
            <ArbiscanLink txHash={finalizeTxHash} />
          )}

          {/* Function called */}
          {devMode && (
            <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-surface-border bg-surface px-5 py-3 backdrop-blur-sm md:px-6">
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
                {isWrap ? WRAP_CODE : UNWRAP_CODE}
              </pre>
            </div>
          )}
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

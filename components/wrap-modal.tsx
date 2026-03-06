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
import { DevModeToggle } from "./dev-mode-toggle";
import { wrappableTokens as wrappableTokenConfigs } from "@/lib/tokens";
import { ArbiscanLink } from "./arbiscan-link";

const WRAP_CODE = `function wrap(address to, uint256 amount) public virtual override returns (euint256) {
    // take ownership of the underlying tokens
    SafeERC20.safeTransferFrom(IERC20(underlying()), msg.sender, address(this), amount - (amount % rate()));

    // mint confidential tokens to recipient
    euint256 wrappedAmountSent = _mint(to, Nox.toEuint256(amount / rate()));
    Nox.allowTransient(wrappedAmountSent, msg.sender);
    return wrappedAmountSent;
}`;

const UNWRAP_CODE = `function unwrap(uint256 amount) public virtual override returns (uint256) {
    // burn confidential tokens from sender
    _burn(msg.sender, Nox.toEuint256(amount));

    // release underlying tokens to sender
    uint256 underlyingAmount = amount * rate();
    SafeERC20.safeTransfer(IERC20(underlying()), msg.sender, underlyingAmount);
    return underlyingAmount;
}`;

function ProgressTracker({ step, isWrap }: { step: WrapStep; isWrap: boolean }) {
  // Determine state of each step
  const approveState =
    step === "approving"
      ? "active"
      : step === "wrapping" || step === "confirmed"
        ? "done"
        : step === "error"
          ? "done" // keep approve as done if error happened during wrap
          : "pending";

  const wrapState =
    step === "wrapping"
      ? "active"
      : step === "confirmed"
        ? "done"
        : "pending";

  const confirmedState = step === "confirmed" ? "done" : "pending";

  // If error happened during approving, reset approve to pending
  const approveDisplay = step === "error" ? "pending" : approveState;

  return (
    <div
      className="flex w-full flex-col items-center gap-3 md:flex-row md:items-start md:gap-0"
      role="status"
      aria-live="polite"
    >
      <StepIndicator state={approveDisplay} icon="check_circle" label="Approve" />
      <StepIndicator state={wrapState} icon="sync" label={isWrap ? "Wrap" : "Unwrap"} />
      <StepIndicator state={confirmedState} icon="verified" label="Confirmed" />
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
  const { step, error: wrapError, wrapTxHash, wrap, reset: resetWrap } = useWrap();
  const [selectedSymbol, setSelectedSymbol] = useState("RLC");
  const [amount, setAmount] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isProcessing = step === "approving" || step === "wrapping";

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

  // Reset amount and wrap state when modal opens or tab changes
  useEffect(() => {
    if (open) {
      setAmount("");
      setDropdownOpen(false);
      resetWrap();
    }
  }, [open, activeTab, resetWrap]);

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
    if (selectedToken) {
      setAmount(selectedToken.formatted);
    }
  }, [selectedToken]);

  const handleSelectToken = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setAmount("");
    setDropdownOpen(false);
  }, []);

  // Find the original token config for the wrap hook
  const selectedTokenConfig = wrappableTokenConfigs.find(
    (t) => t.symbol === selectedSymbol
  );

  const handleWrap = useCallback(async () => {
    if (!selectedTokenConfig || !amount) return;
    await wrap(selectedTokenConfig, amount);
  }, [selectedTokenConfig, amount, wrap]);

  // Validation
  const parsedAmount = parseFloat(amount) || 0;
  const maxAmount = parseFloat(selectedToken?.formatted ?? "0") || 0;
  const isOverBalance = parsedAmount > maxAmount;
  const isValidAmount = parsedAmount > 0 && !isOverBalance;

  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(() => {
    const code = activeTab === "wrap" ? WRAP_CODE : UNWRAP_CODE;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [activeTab]);

  const isWrap = activeTab === "wrap";
  const cTokenSymbol = `c${selectedToken?.symbol ?? "USDC"}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] max-w-[calc(100%-2rem)] gap-2.5 overflow-y-auto overflow-x-hidden rounded-[40px] border-modal-border bg-modal-bg px-6 py-[26px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 md:px-10 sm:max-w-[552px]"
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
                <span className="text-text-heading">
                  {selectedToken ? `${selectedToken.formatted} ${selectedToken.symbol}` : "0"}
                </span>
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
                      className="absolute left-0 top-full z-50 mt-1 min-w-[160px] origin-top-left animate-[dropdown-in_150ms_ease-out] motion-reduce:animate-none rounded-xl border border-surface-border bg-modal-bg p-2 shadow-lg"
                    >
                      {wrappableTokens.map((token) => (
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
                <span className="font-mulish text-text-body">~0.0001 ETH</span>
              </div>
            </div>

            {/* Error message */}
            {wrapError && (
              <div className="flex items-start gap-2 rounded-xl border border-tx-error-text/30 bg-tx-error-bg px-4 py-3">
                <span aria-hidden="true" className="material-icons text-[18px]! text-tx-error-text">
                  error
                </span>
                <p className="min-w-0 flex-1 font-mulish text-xs text-tx-error-text">
                  {wrapError}
                </p>
                <button
                  type="button"
                  onClick={resetWrap}
                  className="cursor-pointer font-mulish text-xs font-bold text-tx-error-text underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              disabled={isWrap ? (!isValidAmount || isProcessing) : !isValidAmount}
              onClick={isWrap ? handleWrap : undefined}
              className="mx-auto flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 md:w-[215px] md:px-5 md:py-3"
            >
              {isProcessing ? (
                <>
                  <span aria-hidden="true" className="material-icons animate-spin motion-reduce:animate-none text-[16px]! text-primary-foreground md:text-[20px]!">
                    sync
                  </span>
                  <span className="font-mulish text-sm font-bold text-primary-foreground md:text-lg">
                    {step === "approving" ? "Approving..." : "Wrapping..."}
                  </span>
                </>
              ) : step === "confirmed" ? (
                <>
                  <span aria-hidden="true" className="material-icons text-[16px]! text-primary-foreground md:text-[20px]!">
                    check_circle
                  </span>
                  <span className="font-mulish text-sm font-bold text-primary-foreground md:text-lg">
                    Wrapped!
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
          <ProgressTracker step={step} isWrap={isWrap} />

          {/* Arbiscan link on success */}
          {step === "confirmed" && wrapTxHash && (
            <ArbiscanLink txHash={wrapTxHash} />
          )}

          {/* Function called (dev mode only) */}
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

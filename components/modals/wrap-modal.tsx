'use client';

import { useWrapModal } from './wrap-modal-provider';
import { ArbiscanLink } from '@/components/shared/arbiscan-link';
import { CodeSection } from '@/components/shared/code-section';
import { EncryptedBalance } from '@/components/shared/encrypted-balance';
import { ErrorMessage } from '@/components/shared/error-message';
import { InfoCard } from '@/components/shared/info-card';
import {
  ProgressTracker,
  type ProgressStep,
} from '@/components/shared/step-indicator';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useDecryptBalance } from '@/hooks/use-decrypt-balance';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useDropdown } from '@/hooks/use-dropdown';
import { useEstimatedFee } from '@/hooks/use-estimated-fee';
import { useTokenBalances } from '@/hooks/use-token-balances';
import { useUnwrap } from '@/hooks/use-unwrap';
import { useWrap } from '@/hooks/use-wrap';
import { wrappableTokens as wrappableTokenConfigs } from '@/lib/tokens';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

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

const WRAP_STEPS: ProgressStep[] = [
  { key: 'approving', icon: 'check_circle', label: 'Approve' },
  { key: 'wrapping', icon: 'sync', label: 'Wrap' },
  { key: 'confirmed', icon: 'verified', label: 'Confirmed' },
];

const UNWRAP_STEPS: ProgressStep[] = [
  { key: 'encrypting', icon: 'lock', label: 'Encrypt' },
  { key: 'unwrapping', icon: 'sync', label: 'Unwrap' },
  { key: 'finalizing', icon: 'check_circle', label: 'Finalize' },
  { key: 'confirmed', icon: 'verified', label: 'Confirmed' },
];

export function WrapModal() {
  const { open, setOpen, activeTab, setActiveTab } = useWrapModal();
  const { balances } = useTokenBalances();
  const { enabled: devMode } = useDevMode();
  const {
    step: wrapStep,
    error: wrapError,
    wrapTxHash,
    wrap,
    reset: resetWrap,
  } = useWrap();
  const {
    step: unwrapStep,
    error: unwrapError,
    isFinalizeError,
    finalizeTxHash,
    unwrap,
    retryFinalize,
    reset: resetUnwrap,
  } = useUnwrap();
  const {
    decryptedAmounts,
    decryptingSymbol,
    decrypt: handleDecryptBalance,
    getConfidentialDisplay,
  } = useDecryptBalance();
  const {
    open: dropdownOpen,
    setOpen: setDropdownOpen,
    triggerRef,
    contentRef: dropdownRef,
  } = useDropdown();
  const [selectedSymbol, setSelectedSymbol] = useState('RLC');
  const cSelectedSymbol = `c${selectedSymbol}`;
  const [amount, setAmount] = useState('');
  const isWrap = activeTab === 'wrap';
  // Gas limits: wrap (approve + wrap) ~150k, unwrap (encrypt + unwrap + finalize) ~300k
  const { fee: estimatedFee } = useEstimatedFee(isWrap ? 150_000n : 300_000n);
  const isWrapProcessing = wrapStep === 'approving' || wrapStep === 'wrapping';
  const isUnwrapProcessing =
    unwrapStep === 'encrypting' ||
    unwrapStep === 'unwrapping' ||
    unwrapStep === 'finalizing';
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
      formatted: bal?.formatted ?? '0',
    };
  });

  const selectedToken =
    wrappableTokens.find((t) => t.symbol === selectedSymbol) ??
    wrappableTokens[0];

  // Reset amount and state when modal opens or tab changes
  useEffect(() => {
    if (open) {
      setAmount('');
      setDropdownOpen(false);
      resetWrap();
      resetUnwrap();
    }
  }, [open, activeTab, resetWrap, resetUnwrap, setDropdownOpen]);

  const handleAmountChange = useCallback((value: string) => {
    // Allow empty, or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handleMax = useCallback(() => {
    if (isWrap) {
      if (selectedToken) setAmount(selectedToken.formatted);
    } else {
      const decrypted = decryptedAmounts[cSelectedSymbol];
      if (decrypted) setAmount(decrypted);
    }
  }, [isWrap, selectedToken, decryptedAmounts, cSelectedSymbol]);

  const handleSelectToken = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      setAmount('');
      setDropdownOpen(false);
    },
    [setDropdownOpen]
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
  const hasDecryptedBalance =
    !isWrap && decryptedAmounts[cSelectedSymbol] !== undefined;
  const maxAmountStr = isWrap
    ? (selectedToken?.formatted ?? '0')
    : (decryptedAmounts[cSelectedSymbol] ?? '0');
  const maxAmount = parseFloat(maxAmountStr) || 0;
  // Only check over-balance if we know the balance (wrap always, unwrap only if decrypted)
  const isOverBalance =
    (isWrap || hasDecryptedBalance) && parsedAmount > maxAmount;
  // For unwrap: require decrypted balance before allowing submission
  const needsDecrypt = !isWrap && !hasDecryptedBalance && parsedAmount > 0;
  const isValidAmount = parsedAmount > 0 && !isOverBalance && !needsDecrypt;

  const cTokenSymbol = `c${selectedToken?.symbol ?? 'USDC'}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="border-modal-border bg-modal-bg no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 max-h-[90vh] max-w-[calc(100%-2rem)] gap-2.5 overflow-x-hidden overflow-y-auto rounded-[40px] px-6 py-[26px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 sm:max-w-[552px] md:px-10"
        showCloseButton={false}
      >
        {/* Close button */}
        <div className="flex w-full items-center justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-mulish text-text-heading cursor-pointer text-xl transition-opacity hover:opacity-70"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="flex w-full min-w-0 flex-col items-center gap-[26px]">
          {/* Header */}
          <div className="text-center">
            <DialogTitle className="font-mulish text-text-heading text-[26px] leading-10 font-bold md:text-[34px]">
              Convert Assets
            </DialogTitle>
            <DialogDescription className="font-mulish text-text-body mt-2 text-sm leading-6 md:text-base">
              {isWrap
                ? 'Make your assets confidential'
                : 'Return your assets to public'}
            </DialogDescription>
          </div>

          {/* Glass card */}
          <div className="border-surface-border bg-surface flex w-full flex-col gap-[26px] rounded-[32px] border p-5 backdrop-blur-sm md:px-10 md:py-5">
            {/* Tabs */}
            <div className="flex items-start justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('wrap')}
                className={`font-mulish flex w-[48%] cursor-pointer items-center justify-center rounded-2xl py-3.5 text-sm font-bold transition-colors ${
                  isWrap
                    ? 'border-surface-border bg-surface text-text-heading border'
                    : 'text-text-muted hover:text-text-body'
                }`}
              >
                Wrap
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unwrap')}
                className={`font-mulish flex w-[48%] cursor-pointer items-center justify-center rounded-2xl py-3.5 text-sm font-bold transition-colors ${
                  !isWrap
                    ? 'border-surface-border bg-surface text-text-heading border'
                    : 'text-text-muted hover:text-text-body'
                }`}
              >
                Unwrap
              </button>
            </div>

            {/* Amount label + balance */}
            <div className="flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between md:gap-0">
              <span className="font-mulish text-text-muted font-bold tracking-[1.2px]">
                {isWrap ? 'Amount to Wrap' : 'Amount to Unwrap'}
              </span>
              <div className="font-mulish flex items-center gap-1.5">
                <span className="text-text-body">
                  {isWrap ? 'Public Asset :' : 'Confidential Asset :'}
                </span>
                {isWrap ? (
                  <span className="text-text-heading">
                    {selectedToken
                      ? `${selectedToken.formatted} ${selectedToken.symbol}`
                      : '0'}
                  </span>
                ) : (
                  <span className="text-text-heading flex items-center gap-1">
                    <EncryptedBalance
                      symbol={cSelectedSymbol}
                      display={getConfidentialDisplay(cSelectedSymbol)}
                      decryptingSymbol={decryptingSymbol}
                      onDecrypt={handleDecryptBalance}
                    />
                  </span>
                )}
              </div>
            </div>

            {/* Input area */}
            <div className="border-surface-border bg-surface flex flex-col gap-4 rounded-2xl border px-5 py-[17px]">
              <div className="flex items-center justify-between">
                {/* Token selector */}
                <div className="relative">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(30,41,59,0.5)] px-3 py-1.5 transition-opacity hover:opacity-80"
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
                    <span className="font-mulish text-text-heading text-sm font-bold">
                      {isWrap ? selectedToken?.symbol : cTokenSymbol}
                    </span>
                    <span
                      aria-hidden="true"
                      className="material-icons text-text-body text-[14px]!"
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      ref={dropdownRef}
                      role="listbox"
                      aria-label="Select token"
                      className={`border-surface-border bg-modal-bg absolute top-full left-0 z-50 mt-1 origin-top-left animate-[dropdown-in_150ms_ease-out] rounded-xl border p-2 shadow-lg motion-reduce:animate-none ${
                        isWrap ? 'min-w-[160px]' : 'min-w-[220px]'
                      }`}
                    >
                      {wrappableTokens.map((token) => {
                        const cSymbol = `c${token.symbol}`;
                        const confidentialDisplay =
                          getConfidentialDisplay(cSymbol);
                        return (
                          <button
                            key={token.symbol}
                            type="button"
                            onClick={() => handleSelectToken(token.symbol)}
                            className={`hover:bg-surface flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                              token.symbol === selectedSymbol
                                ? 'bg-surface'
                                : ''
                            }`}
                          >
                            <Image
                              src={token.icon}
                              alt=""
                              width={20}
                              height={20}
                              className="size-5"
                            />
                            <span className="font-mulish text-text-heading text-sm font-bold">
                              {isWrap ? token.symbol : cSymbol}
                            </span>
                            {isWrap ? (
                              <span className="font-mulish text-text-body ml-auto text-xs">
                                {token.formatted}
                              </span>
                            ) : (
                              <span className="font-mulish text-text-body ml-auto flex items-center gap-1.5 text-xs">
                                <EncryptedBalance
                                  symbol={cSymbol}
                                  display={confidentialDisplay}
                                  decryptingSymbol={decryptingSymbol}
                                  onDecrypt={handleDecryptBalance}
                                  showSymbol={false}
                                  iconSize="text-[14px]!"
                                />
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
                  className={`font-mulish focus-visible:ring-primary/50 placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-right text-2xl leading-9 font-bold outline-none focus-visible:rounded focus-visible:ring-2 md:text-[30px] ${
                    isOverBalance ? 'text-tx-error-text' : 'text-text-heading'
                  }`}
                  aria-label="Amount"
                  aria-invalid={isOverBalance || needsDecrypt}
                  aria-describedby={
                    isOverBalance
                      ? 'wrap-balance-error'
                      : needsDecrypt
                        ? 'wrap-decrypt-hint'
                        : undefined
                  }
                />
              </div>
              {isOverBalance && (
                <p
                  id="wrap-balance-error"
                  className="font-mulish text-tx-error-text pl-1 text-xs"
                >
                  Insufficient balance
                </p>
              )}
              {needsDecrypt && (
                <p
                  id="wrap-decrypt-hint"
                  className="font-mulish text-primary pl-1 text-xs"
                >
                  Decrypt your balance first to continue
                </p>
              )}

              {/* Network + MAX */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mulish text-text-muted">
                  Arbitrum Sepolia
                </span>
                <button
                  type="button"
                  onClick={handleMax}
                  className="font-mulish text-primary cursor-pointer font-bold transition-opacity hover:opacity-80"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Transaction details */}
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-muted">
                  You will receive
                </span>
                <span className="font-mulish text-text-heading font-medium">
                  {isWrap
                    ? `1:1 ${cTokenSymbol}`
                    : `1:1 ${selectedToken?.symbol}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-muted">
                  Estimated Gas Fee
                </span>
                <span className="font-mulish text-text-body">
                  {estimatedFee ?? '...'} ETH
                </span>
              </div>
            </div>

            {/* Error message */}
            {currentError && !isFinalizeError && (
              <ErrorMessage
                error={currentError}
                onRetry={isWrap ? resetWrap : resetUnwrap}
              />
            )}
            {currentError && isFinalizeError && (
              <div className="border-tx-error-text/30 bg-tx-error-bg flex flex-col gap-2 rounded-xl border px-4 py-3">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="material-icons text-tx-error-text text-[18px]!"
                  >
                    warning
                  </span>
                  <p className="font-mulish text-tx-error-text min-w-0 flex-1 text-xs">
                    Your tokens have been unwrapped but the finalization failed.
                    Your tokens are in transit — click below to retry and
                    recover them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={retryFinalize}
                  className="bg-tx-error-text font-mulish text-primary-foreground cursor-pointer self-end rounded-lg px-4 py-1.5 text-xs font-bold transition-opacity hover:opacity-80"
                >
                  Retry Finalize
                </button>
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              disabled={!isValidAmount || isProcessing}
              onClick={isWrap ? handleWrap : handleUnwrap}
              className="bg-primary hover:bg-primary-hover mx-auto flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:w-[215px] md:px-5 md:py-3"
            >
              {isProcessing ? (
                <>
                  <span
                    aria-hidden="true"
                    className="material-icons text-primary-foreground animate-spin text-[16px]! motion-reduce:animate-none md:text-[20px]!"
                  >
                    sync
                  </span>
                  <span className="font-mulish text-primary-foreground text-sm font-bold md:text-lg">
                    {isWrap
                      ? wrapStep === 'approving'
                        ? 'Approving...'
                        : 'Wrapping...'
                      : unwrapStep === 'encrypting'
                        ? 'Encrypting...'
                        : unwrapStep === 'unwrapping'
                          ? 'Unwrapping...'
                          : 'Finalizing...'}
                  </span>
                </>
              ) : (isWrap ? wrapStep : unwrapStep) === 'confirmed' ? (
                <>
                  <span
                    aria-hidden="true"
                    className="material-icons text-primary-foreground text-[16px]! md:text-[20px]!"
                  >
                    check_circle
                  </span>
                  <span className="font-mulish text-primary-foreground text-sm font-bold md:text-lg">
                    {isWrap ? 'Wrapped!' : 'Unwrapped!'}
                  </span>
                </>
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className="material-icons text-primary-foreground text-[16px]! md:text-[20px]!"
                  >
                    account_balance_wallet
                  </span>
                  <span className="font-mulish text-primary-foreground text-sm font-bold md:text-lg">
                    {isWrap ? 'Wrap Assets' : 'Unwrap Assets'}
                  </span>
                </>
              )}
            </button>

            {/* How it works */}
            <InfoCard>
              {isWrap
                ? "Wrapping moves your tokens from the public Arbitrum ledger into Confidential Token's private vault. Once wrapped, your balance and transfers are only visible to you."
                : 'Unwrapping moves your confidential tokens back to the public Arbitrum ledger. Once unwrapped, your balance and transfers are visible on-chain.'}
            </InfoCard>
          </div>

          {/* Progress tracker */}
          <ProgressTracker
            currentStep={isWrap ? wrapStep : unwrapStep}
            steps={isWrap ? WRAP_STEPS : UNWRAP_STEPS}
          />

          {/* Arbiscan link on success */}
          {isWrap && wrapStep === 'confirmed' && wrapTxHash && (
            <ArbiscanLink txHash={wrapTxHash} />
          )}
          {!isWrap && unwrapStep === 'confirmed' && finalizeTxHash && (
            <ArbiscanLink txHash={finalizeTxHash} />
          )}

          {/* Function called */}
          {devMode && <CodeSection code={isWrap ? WRAP_CODE : UNWRAP_CODE} />}
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-inter text-text-muted mt-1 w-full cursor-pointer text-center text-[15px] font-medium transition-opacity hover:opacity-70"
        >
          Cancel
        </button>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useTransferModal } from './transfer-modal-provider';
import { CodeSection } from '@/components/shared/code-section';
import { EncryptedBalance } from '@/components/shared/encrypted-balance';
import { ErrorMessage } from '@/components/shared/error-message';
import { InfoCard } from '@/components/shared/info-card';
import {
  ProgressTracker,
  type ProgressStep,
} from '@/components/shared/step-indicator';
import { TxSuccessStatus } from '@/components/shared/tx-success-status';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useConfidentialTransfer } from '@/hooks/use-confidential-transfer';
import { useDecryptBalance } from '@/hooks/use-decrypt-balance';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useDropdown } from '@/hooks/use-dropdown';
import { useEstimatedFee } from '@/hooks/use-estimated-fee';
import {
  confidentialTokens,
  wrappableTokens as wrappableTokenConfigs,
} from '@/lib/tokens';
import { truncateAddress } from '@/lib/utils';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { isAddress } from 'viem';

const TRANSFER_CODE = `function confidentialTransfer(
  address to,
  externalEuint256 encryptedAmount,
  bytes calldata inputProof
) public virtual returns (euint256) {
    // decrypt and verify the user-provided encrypted amount
    return _transfer(msg.sender, to,
      Nox.fromExternal(encryptedAmount, inputProof));
}`;

const TRANSFER_STEPS: ProgressStep[] = [
  { key: 'encrypting', icon: 'lock', label: 'Encrypt' },
  { key: 'transferring', icon: 'sync', label: 'Transfer' },
  { key: 'confirmed', icon: 'verified', label: 'Confirmed' },
];

export function TransferModal() {
  const { open, setOpen } = useTransferModal();
  const { enabled: devMode } = useDevMode();
  const { step, error, txHash, transfer, reset } = useConfidentialTransfer();
  const { fee: estimatedFee } = useEstimatedFee(200_000n);
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
  // Default to first token with a real deployed address (cRLC), not placeholder cUSDC
  const defaultSymbol =
    confidentialTokens.find((t) => t.address && t.address.length === 42)
      ?.symbol ??
    confidentialTokens[0]?.symbol ??
    'cRLC';
  const [selectedSymbol, setSelectedSymbol] = useState(defaultSymbol);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const isProcessing = step === 'encrypting' || step === 'transferring';

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setRecipient('');
      setDropdownOpen(false);
      reset();
    }
  }, [open, reset, setDropdownOpen]);

  const handleAmountChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handleSelectToken = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      setAmount('');
      setDropdownOpen(false);
    },
    [setDropdownOpen]
  );

  const handleMax = useCallback(() => {
    const decrypted = decryptedAmounts[selectedSymbol];
    if (decrypted) setAmount(decrypted);
  }, [decryptedAmounts, selectedSymbol]);

  // Find the base token config for the SDK hook
  const baseSymbol = selectedSymbol.replace(/^c/, '');
  const selectedTokenConfig = wrappableTokenConfigs.find(
    (t) => t.symbol === baseSymbol
  );

  const selectedCToken = confidentialTokens.find(
    (t) => t.symbol === selectedSymbol
  );

  const handleTransfer = useCallback(async () => {
    if (!selectedTokenConfig || !amount || !recipient) return;
    await transfer(selectedTokenConfig, amount, recipient);
  }, [selectedTokenConfig, amount, recipient, transfer]);

  // Validation
  const parsedAmount = parseFloat(amount) || 0;
  const hasDecryptedBalance = decryptedAmounts[selectedSymbol] !== undefined;
  const maxAmountStr = decryptedAmounts[selectedSymbol] ?? '0';
  const maxAmount = parseFloat(maxAmountStr) || 0;
  const isOverBalance = hasDecryptedBalance && parsedAmount > maxAmount;
  // Require decrypted balance before allowing submission
  const needsDecrypt = !hasDecryptedBalance && parsedAmount > 0;
  const isValidAmount = parsedAmount > 0 && !isOverBalance && !needsDecrypt;
  const addressValid = isAddress(recipient);
  const canTransfer = isValidAmount && addressValid && !isProcessing;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="border-modal-border bg-modal-bg no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 max-h-[90vh] max-w-[calc(100%-2rem)] gap-2.5 overflow-x-hidden overflow-y-auto rounded-[32px] px-6 py-[26px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 sm:max-w-[552px] md:px-10"
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
            <DialogTitle className="font-mulish text-text-heading text-2xl leading-10 font-bold tracking-[-0.9px] md:text-[36px]">
              Confidential Transfer
            </DialogTitle>
            <DialogDescription className="font-mulish text-text-body mt-3 text-base leading-6">
              Transactions are encrypted and private by default.
            </DialogDescription>
          </div>

          {/* Glass card */}
          <div className="border-surface-border bg-surface flex w-full flex-col gap-[26px] rounded-3xl border px-5 py-[15px] backdrop-blur-sm">
            {/* Amount section */}
            <div className="flex flex-col gap-4">
              {/* Label + balance */}
              <div className="flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between md:gap-0">
                <span className="font-inter text-text-muted pl-1 text-xs font-bold tracking-[1.2px]">
                  Amount
                </span>
                <div className="font-mulish flex items-center gap-1.5 pl-1">
                  <span className="text-text-body">Balance :</span>
                  <span className="text-text-heading flex items-center gap-1">
                    <EncryptedBalance
                      symbol={selectedSymbol}
                      display={getConfidentialDisplay(selectedSymbol)}
                      decryptingSymbol={decryptingSymbol}
                      onDecrypt={handleDecryptBalance}
                    />
                  </span>
                </div>
              </div>

              {/* Input area */}
              <div className="border-surface-border bg-surface flex flex-col gap-4 rounded-2xl border px-4 py-[17px]">
                <div className="flex items-center justify-between">
                  {/* Token selector */}
                  <div className="relative">
                    <button
                      ref={triggerRef}
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(30,41,59,0.5)] px-3 py-2.5 transition-opacity hover:opacity-80"
                      aria-label="Select token"
                      aria-expanded={dropdownOpen}
                    >
                      {selectedCToken && (
                        <Image
                          src={selectedCToken.icon}
                          alt=""
                          width={24}
                          height={24}
                          className="size-6"
                        />
                      )}
                      <span className="font-mulish text-text-heading text-sm font-bold md:text-base">
                        {selectedSymbol}
                      </span>
                      <span
                        aria-hidden="true"
                        className="material-icons text-text-body text-[16px]! md:text-[18px]!"
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
                        className="border-surface-border bg-modal-bg absolute top-full left-0 z-50 mt-1 min-w-[220px] origin-top-left animate-[dropdown-in_150ms_ease-out] rounded-xl border p-2 shadow-lg motion-reduce:animate-none"
                      >
                        {confidentialTokens.map((token) => {
                          const confidentialDisplay = getConfidentialDisplay(
                            token.symbol
                          );
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
                                width={24}
                                height={24}
                                className="size-6"
                              />
                              <span className="font-mulish text-text-heading text-sm font-bold">
                                {token.symbol}
                              </span>
                              <span className="font-mulish text-text-body ml-auto flex items-center gap-1.5 text-xs">
                                <EncryptedBalance
                                  symbol={token.symbol}
                                  display={confidentialDisplay}
                                  decryptingSymbol={decryptingSymbol}
                                  onDecrypt={handleDecryptBalance}
                                  showSymbol={false}
                                  iconSize="text-[14px]!"
                                />
                              </span>
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
                    className={`font-mulish focus-visible:ring-primary/50 placeholder:text-text-muted/60 min-w-0 flex-1 bg-transparent text-right text-2xl leading-8 font-bold outline-none focus-visible:rounded focus-visible:ring-2 ${
                      isOverBalance ? 'text-tx-error-text' : 'text-text-heading'
                    }`}
                    aria-label="Amount"
                    aria-invalid={isOverBalance || needsDecrypt}
                    aria-describedby={
                      isOverBalance
                        ? 'transfer-balance-error'
                        : needsDecrypt
                          ? 'transfer-decrypt-hint'
                          : undefined
                    }
                  />
                </div>

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
                {isOverBalance && (
                  <p
                    id="transfer-balance-error"
                    className="font-mulish text-tx-error-text pl-1 text-xs"
                  >
                    Insufficient balance
                  </p>
                )}
                {needsDecrypt && (
                  <p
                    id="transfer-decrypt-hint"
                    className="font-mulish text-primary pl-1 text-xs"
                  >
                    Decrypt your balance first to continue
                  </p>
                )}
              </div>
            </div>

            {/* Recipient address section */}
            <div className="flex flex-col gap-4">
              {/* Label */}
              <span className="font-mulish text-text-muted pl-1 text-xs font-bold tracking-[1.2px]">
                Recipient Address
              </span>

              {/* Address input */}
              <div className="px-2.5 py-3">
                <div className="border-surface-border bg-surface flex items-center gap-3 rounded-2xl border px-[17px] py-[7px]">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="font-mulish text-text-heading focus-visible:ring-primary/50 placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:rounded focus-visible:ring-2"
                    aria-label="Recipient address"
                  />
                  {recipient.length > 0 && (
                    <span
                      aria-label={
                        addressValid ? 'Valid address' : 'Invalid address'
                      }
                      className={`material-icons text-[24px]! ${
                        addressValid
                          ? 'text-tx-success-text'
                          : 'text-tx-error-text'
                      }`}
                    >
                      {addressValid ? 'check_circle' : 'cancel'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction info summary */}
            <div className="border-surface-border bg-surface flex flex-col gap-3 rounded-2xl border p-[21px] text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-body">Recipient</span>
                <span className="font-mulish text-text-heading flex items-center gap-1 text-[10px] font-medium md:text-sm">
                  <span
                    aria-hidden="true"
                    className="material-icons text-primary text-[12px]!"
                  >
                    enhanced_encryption
                  </span>
                  {recipient && addressValid
                    ? truncateAddress(recipient)
                    : 'Encrypted Hash'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-body">Token</span>
                <span className="font-mulish text-text-heading text-[10px] font-medium md:text-sm">
                  {selectedSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mulish text-text-body">Network Fee</span>
                <span className="font-mulish text-text-heading text-[10px] font-medium md:text-sm">
                  {estimatedFee ?? '...'} ETH
                </span>
              </div>
            </div>

            {/* Error message */}
            {error && <ErrorMessage error={error} onRetry={reset} />}

            {/* CTA */}
            <div className="flex justify-center">
              <button
                type="button"
                disabled={!canTransfer}
                onClick={handleTransfer}
                className="bg-primary hover:bg-primary-hover flex w-[150px] cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:w-[181px] md:px-[18px] md:py-3"
              >
                {isProcessing ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="material-icons text-primary-foreground animate-spin text-[16px]! motion-reduce:animate-none md:text-[20px]!"
                    >
                      sync
                    </span>
                    <span className="font-mulish text-primary-foreground text-sm font-bold md:text-base">
                      {step === 'encrypting'
                        ? 'Encrypting...'
                        : 'Transferring...'}
                    </span>
                  </>
                ) : step === 'confirmed' ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="material-icons text-primary-foreground text-[16px]! md:text-[20px]!"
                    >
                      check_circle
                    </span>
                    <span className="font-mulish text-primary-foreground text-sm font-bold md:text-base">
                      Transferred!
                    </span>
                  </>
                ) : (
                  <span className="font-mulish text-primary-foreground text-sm font-bold md:text-base">
                    Confirm &amp; Sign
                  </span>
                )}
              </button>
            </div>

            {/* Progress tracker */}
            <ProgressTracker currentStep={step} steps={TRANSFER_STEPS} />

            {/* How it works */}
            <InfoCard className="md:!p-3">
              Amounts are encrypted.
              <br />
              The transfer is verified on-chain without revealing values.
            </InfoCard>

            {/* Function called */}
            {devMode && <CodeSection code={TRANSFER_CODE} />}

            {/* Arbiscan link on success */}
            {step === 'confirmed' && txHash && (
              <TxSuccessStatus
                message="Confidential Transfer Complete"
                txHash={txHash}
              />
            )}
          </div>
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

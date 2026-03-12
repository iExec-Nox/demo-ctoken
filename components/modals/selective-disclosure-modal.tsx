'use client';

import { useSelectiveDisclosureModal } from './selective-disclosure-modal-provider';
import { CodeSection } from '@/components/shared/code-section';
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
import { useAddViewer } from '@/hooks/use-add-viewer';
import { useDevMode } from '@/hooks/use-dev-mode';
import { NOX_COMPUTE_ADDRESS } from '@/lib/nox-compute-abi';
import { confidentialTokens } from '@/lib/tokens';
import { useCallback, useState } from 'react';
import { isAddress } from 'viem';

type ScopeType = 'full' | 'specific';

const ADD_VIEWER_CODE = `// 1. Read the balance handle
const handle = await publicClient.readContract({
  address: cTokenAddress,
  abi: confidentialTokenAbi,
  functionName: 'confidentialBalanceOf',
  args: [userAddress],
});

// 2. Grant viewer access on NoxCompute
await walletClient.writeContract({
  address: '${NOX_COMPUTE_ADDRESS}',
  abi: noxComputeAbi,
  functionName: 'addViewer',
  args: [handle, viewerAddress],
});`;

interface MockViewer {
  address: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  scope: 'full' | 'token';
  tokenLabel?: string;
  date: string;
}

const CURRENT_VIEWERS: MockViewer[] = [
  {
    address: '0x3fA...E901',
    icon: 'account_balance',
    iconColor: 'text-primary',
    iconBg: 'bg-primary-alpha-18',
    scope: 'full',
    date: '12/02/2026 10:30 CET',
  },
  {
    address: '0x882...19a4',
    icon: 'person',
    iconColor: 'text-primary',
    iconBg: 'bg-primary-alpha-18',
    scope: 'token',
    tokenLabel: 'USDC Only',
    date: '12/02/2026 10:30 CET',
  },
  {
    address: '0x91d...77b2',
    icon: 'verified_user',
    iconColor: 'text-text-body',
    iconBg: 'bg-surface',
    scope: 'full',
    date: '12/02/2026 10:30 CET',
  },
];

const PAST_VIEWERS: MockViewer[] = [
  {
    address: '0x3fA...E901',
    icon: 'account_balance',
    iconColor: 'text-primary',
    iconBg: 'bg-primary-alpha-18',
    scope: 'full',
    date: '12/02/2026 10:30 CET',
  },
];

function ViewerCard({ viewer }: { viewer: MockViewer }) {
  return (
    <div className="border-surface-border bg-surface flex items-center justify-between rounded-2xl border p-[21px] backdrop-blur-sm">
      <div className="flex items-center gap-2.5 md:gap-4">
        <div
          className={`flex size-[29px] shrink-0 items-center justify-center rounded-full md:size-10 ${viewer.iconBg}`}
        >
          <span
            aria-hidden="true"
            className={`material-icons text-[14px]! md:text-[20px]! ${viewer.iconColor}`}
          >
            {viewer.icon}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mulish text-text-heading text-xs md:text-sm">
            {viewer.address}
          </span>
          {viewer.scope === 'full' ? (
            <span className="border-tx-success-text/20 bg-tx-success-bg font-mulish text-tx-success-text inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold">
              Full Portfolio
            </span>
          ) : (
            <span className="border-primary bg-primary font-mulish text-primary-foreground inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-bold">
              {viewer.tokenLabel}
            </span>
          )}
        </div>
      </div>
      <span className="font-mulish text-text-muted flex-1 text-right text-[11px] md:flex-none md:text-sm">
        {viewer.date}
      </span>
    </div>
  );
}

const DISCLOSURE_STEPS: ProgressStep[] = [
  { key: 'reading-handle', icon: 'search', label: 'Read Handle' },
  { key: 'granting', icon: 'sync', label: 'Grant Access' },
  { key: 'confirmed', icon: 'verified', label: 'Confirmed' },
];

export function SelectiveDisclosureModal() {
  const { open, setOpen } = useSelectiveDisclosureModal();
  const { enabled: devMode } = useDevMode();
  const { step, error, txHash, grant, reset } = useAddViewer();

  const [viewerAddress, setViewerAddress] = useState('');
  const [scope, setScope] = useState<ScopeType>('specific');
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());

  const isProcessing = step === 'reading-handle' || step === 'granting';

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
        setViewerAddress('');
        setScope('specific');
        setSelectedTokens(new Set());
        reset();
      }
    },
    [setOpen, reset]
  );

  const handleScopeChange = useCallback((newScope: ScopeType) => {
    setScope(newScope);
    if (newScope === 'full') {
      setSelectedTokens(new Set(confidentialTokens.map((t) => t.symbol)));
    } else {
      setSelectedTokens(new Set());
    }
  }, []);

  const toggleToken = useCallback(
    (symbol: string) => {
      if (scope === 'full') return;
      setSelectedTokens((prev) => {
        const next = new Set(prev);
        if (next.has(symbol)) {
          next.delete(symbol);
        } else {
          next.add(symbol);
        }
        return next;
      });
    },
    [scope]
  );

  const handleGrant = useCallback(async () => {
    const tokensToGrant = confidentialTokens.filter((t) =>
      selectedTokens.has(t.symbol)
    );
    await grant(viewerAddress, tokensToGrant);
  }, [viewerAddress, selectedTokens, grant]);

  const isValidAddress = isAddress(viewerAddress);
  const hasTokenSelected = selectedTokens.size > 0;
  const canGrant = isValidAddress && hasTokenSelected && !isProcessing;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="border-modal-border bg-modal-bg no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 max-h-[90vh] max-w-[calc(100%-2rem)] gap-[18px] overflow-x-hidden overflow-y-auto rounded-[32px] px-6 py-[34px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 sm:max-w-[784px]"
        showCloseButton={false}
      >
        {/* Close button */}
        <div className="flex w-full items-center justify-end">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="font-mulish text-text-heading cursor-pointer text-xl transition-opacity hover:opacity-70"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Header */}
        <div className="w-full text-center">
          <DialogTitle className="font-mulish text-text-heading text-[32px] leading-10 font-bold tracking-[-0.9px] md:text-[36px]">
            Selective Disclosure
          </DialogTitle>
          <DialogDescription className="font-mulish text-text-body mt-4 text-lg leading-[29.25px]">
            Grant third parties the ability to audit your confidential
            transactions without giving up control of your assets.
          </DialogDescription>
        </div>

        {/* Add a New Viewer — glass card */}
        <div className="border-surface-border bg-surface flex w-full flex-col gap-5 rounded-3xl border p-5 backdrop-blur-sm md:gap-[35px]">
          <div className="flex items-center justify-between">
            <h3 className="font-mulish text-text-heading text-xl font-bold">
              Add a New Viewer
            </h3>
            <span
              aria-hidden="true"
              className="material-icons text-primary text-[16px]! md:hidden"
            >
              visibility
            </span>
          </div>

          <div className="flex flex-col items-center gap-[26px]">
            {/* Viewer Address */}
            <div className="flex w-full flex-col gap-[11px]">
              <label
                htmlFor="viewer-address"
                className="font-mulish text-text-body text-sm font-bold"
              >
                Viewer Address
              </label>
              <div className="border-surface-border bg-surface focus-within:ring-primary/50 flex h-[50px] w-full items-center gap-2 rounded-xl border px-4 transition-colors focus-within:ring-2">
                <input
                  id="viewer-address"
                  type="text"
                  placeholder="0x..."
                  value={viewerAddress}
                  onChange={(e) => setViewerAddress(e.target.value)}
                  disabled={isProcessing || step === 'confirmed'}
                  className="font-mulish text-text-heading placeholder:text-text-heading/60 min-w-0 flex-1 bg-transparent text-base outline-none disabled:opacity-50"
                />
                {viewerAddress.length > 0 && (
                  <span
                    aria-label={
                      isValidAddress ? 'Valid address' : 'Invalid address'
                    }
                    className={`material-icons text-[24px]! ${
                      isValidAddress
                        ? 'text-tx-success-text'
                        : 'text-tx-error-text'
                    }`}
                  >
                    {isValidAddress ? 'check_circle' : 'cancel'}
                  </span>
                )}
              </div>
            </div>

            {/* Scope of Access */}
            <div className="flex w-full flex-col gap-[15px]">
              <span className="font-mulish text-text-body text-sm font-bold">
                Scope of Access
              </span>

              <div
                className="flex flex-col gap-5 md:grid md:grid-cols-2"
                role="radiogroup"
                aria-label="Scope of access"
              >
                {/* Full Portfolio */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={scope === 'full'}
                  onClick={() => handleScopeChange('full')}
                  disabled={isProcessing || step === 'confirmed'}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-[17px] backdrop-blur-sm transition-colors disabled:cursor-default disabled:opacity-50 ${
                    scope === 'full'
                      ? 'border-primary bg-primary-alpha-18'
                      : 'border-surface-border bg-surface'
                  }`}
                >
                  <div
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      scope === 'full'
                        ? 'border-primary bg-primary'
                        : 'border-surface-border'
                    }`}
                  >
                    {scope === 'full' && (
                      <div className="bg-primary-foreground size-2 rounded-full" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-mulish text-text-heading text-sm font-bold">
                      Full Portfolio
                    </p>
                    <p className="font-mulish text-text-muted text-xs">
                      Access all confidential history
                    </p>
                  </div>
                </button>

                {/* Specific Token */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={scope === 'specific'}
                  onClick={() => handleScopeChange('specific')}
                  disabled={isProcessing || step === 'confirmed'}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-[17px] backdrop-blur-sm transition-colors disabled:cursor-default disabled:opacity-50 ${
                    scope === 'specific'
                      ? 'border-primary bg-primary-alpha-18'
                      : 'border-surface-border bg-surface'
                  }`}
                >
                  <div
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      scope === 'specific'
                        ? 'border-primary bg-primary'
                        : 'border-surface-border'
                    }`}
                  >
                    {scope === 'specific' && (
                      <div className="bg-primary-foreground size-2 rounded-full" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-mulish text-text-heading text-sm font-bold">
                      Specific Token
                    </p>
                    <p className="font-mulish text-text-muted text-xs">
                      Select one asset only
                    </p>
                  </div>
                </button>
              </div>

              {/* Token list */}
              <div className="flex flex-col gap-2">
                <span className="font-mulish text-text-body text-sm font-bold">
                  Select Token to be disclosed
                </span>

                {confidentialTokens.map((token) => {
                  const isChecked = selectedTokens.has(token.symbol);
                  const baseSymbol = token.symbol.replace(/^c/, '');
                  return (
                    <button
                      key={token.symbol}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleToken(token.symbol)}
                      disabled={
                        scope === 'full' || isProcessing || step === 'confirmed'
                      }
                      className="border-surface-border bg-surface flex w-full cursor-pointer items-center justify-between rounded-xl border px-[17px] py-2 transition-colors hover:opacity-80 disabled:cursor-default disabled:opacity-70"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex size-4 shrink-0 items-center justify-center border ${
                            isChecked
                              ? 'border-primary bg-primary'
                              : 'border-surface-border'
                          }`}
                        >
                          {isChecked && (
                            <span
                              aria-hidden="true"
                              className="material-icons text-primary-foreground text-[12px]!"
                            >
                              check
                            </span>
                          )}
                        </div>
                        <span className="font-mulish text-text-heading/60 text-base">
                          {baseSymbol}
                        </span>
                      </div>
                      <span className="font-mulish text-text-heading/60 text-sm">
                        {token.address && token.address !== '0x...'
                          ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
                          : '0x12Z456....'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled={!canGrant}
              onClick={handleGrant}
              className="bg-primary hover:bg-primary-hover flex w-[181px] cursor-pointer items-center justify-center gap-2 rounded-xl px-[18px] py-3 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <span
                    aria-hidden="true"
                    className="material-icons text-primary-foreground animate-spin text-[16px]! motion-reduce:animate-none"
                  >
                    sync
                  </span>
                  <span className="font-mulish text-primary-foreground text-base font-bold">
                    {step === 'reading-handle' ? 'Reading...' : 'Granting...'}
                  </span>
                </>
              ) : step === 'confirmed' ? (
                <>
                  <span
                    aria-hidden="true"
                    className="material-icons text-primary-foreground text-[16px]!"
                  >
                    check_circle
                  </span>
                  <span className="font-mulish text-primary-foreground text-base font-bold">
                    Granted!
                  </span>
                </>
              ) : (
                <span className="font-mulish text-primary-foreground text-base font-bold">
                  Grant Access
                </span>
              )}
            </button>

            {/* Error message */}
            {step === 'error' && error && (
              <ErrorMessage error={error} onRetry={reset} />
            )}
          </div>

          {/* How it works — inside glass card on mobile */}
          <InfoCard className="backdrop-blur-lg md:!p-3">
            Selective disclosure shares a handle or balance at a given moment.
            The recipient can access data tied to that specific state only.
          </InfoCard>
        </div>

        {/* Progress tracker */}
        <ProgressTracker currentStep={step} steps={DISCLOSURE_STEPS} />

        {/* Arbiscan link on success */}
        {step === 'confirmed' && txHash && (
          <TxSuccessStatus message="Viewer Access Granted" txHash={txHash} />
        )}

        {/* Function called */}
        {devMode && <CodeSection code={ADD_VIEWER_CODE} />}

        {/* Current Viewers */}
        <div className="flex w-full items-center justify-between">
          <span className="font-mulish text-text-muted text-base font-bold tracking-[1.4px]">
            Current Viewers ({CURRENT_VIEWERS.length})
          </span>
          <button
            type="button"
            aria-disabled="true"
            className="font-mulish text-primary cursor-default text-sm font-medium opacity-50"
          >
            Refresh List
          </button>
        </div>

        <div className="flex w-full flex-col gap-3">
          {CURRENT_VIEWERS.map((viewer) => (
            <ViewerCard key={viewer.address + viewer.icon} viewer={viewer} />
          ))}
        </div>

        {/* Past Viewers — desktop only */}
        <div className="hidden w-full flex-col gap-3 md:flex">
          <div className="flex items-center justify-between">
            <span className="font-mulish text-text-muted text-base font-bold tracking-[1.4px]">
              Past Viewers ({PAST_VIEWERS.length})
            </span>
            <button
              type="button"
              aria-disabled="true"
              className="font-mulish text-primary cursor-default text-sm font-medium opacity-50"
            >
              See all
            </button>
          </div>

          {PAST_VIEWERS.map((viewer) => (
            <ViewerCard key={viewer.address + viewer.icon} viewer={viewer} />
          ))}
        </div>

        {/* Security Note */}
        <div className="bg-modal-bg flex w-full items-start gap-3 rounded-xl p-2.5 backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="material-icons text-tx-pending-text shrink-0 text-[24px]!"
          >
            info
          </span>
          <div className="flex flex-col gap-1 py-0.5 text-xs md:flex-row md:items-center md:gap-2.5">
            <span className="font-mulish text-text-heading font-bold">
              Security Note:
            </span>
            <span className="font-mulish text-text-body">
              Access is tied to the current handle state at the time of
              disclosure. Any subsequent transaction that updates the handle
              invalidates prior access.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

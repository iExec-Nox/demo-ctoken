"use client";

import { useCallback, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSelectiveDisclosureModal } from "./selective-disclosure-modal-provider";
import { useDevMode } from "@/hooks/use-dev-mode";
import { DevModeToggle } from "./dev-mode-toggle";
import { confidentialTokens } from "@/lib/tokens";

type ScopeType = "full" | "specific";

const ALLOW_CODE = `const txHash = await walletClient.writeContract({
  address: NOX_ADDRESS,
  abi: NOX_ABI,
  functionName: 'allow',
  args: [
    '0xabc123...', // handle bytes32
    '0xdef456...', // adresse à autoriser
  ],
});`;

interface MockViewer {
  address: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  scope: "full" | "token";
  tokenLabel?: string;
  date: string;
}

const CURRENT_VIEWERS: MockViewer[] = [
  {
    address: "0x3fA...E901",
    icon: "account_balance",
    iconColor: "text-primary",
    iconBg: "bg-primary-alpha-18",
    scope: "full",
    date: "12/02/2026 10:30 CET",
  },
  {
    address: "0x882...19a4",
    icon: "person",
    iconColor: "text-primary",
    iconBg: "bg-primary-alpha-18",
    scope: "token",
    tokenLabel: "USDC Only",
    date: "12/02/2026 10:30 CET",
  },
  {
    address: "0x91d...77b2",
    icon: "verified_user",
    iconColor: "text-text-body",
    iconBg: "bg-surface",
    scope: "full",
    date: "12/02/2026 10:30 CET",
  },
];

const PAST_VIEWERS: MockViewer[] = [
  {
    address: "0x3fA...E901",
    icon: "account_balance",
    iconColor: "text-primary",
    iconBg: "bg-primary-alpha-18",
    scope: "full",
    date: "12/02/2026 10:30 CET",
  },
];

function ViewerCard({ viewer }: { viewer: MockViewer }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface p-[21px] backdrop-blur-sm">
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
          <span className="font-mulish text-xs text-text-heading md:text-sm">
            {viewer.address}
          </span>
          {viewer.scope === "full" ? (
            <span className="inline-flex w-fit items-center rounded-full border border-tx-success-text/20 bg-tx-success-bg px-2 py-0.5 font-mulish text-[10px] font-bold text-tx-success-text">
              Full Portfolio
            </span>
          ) : (
            <span className="inline-flex w-fit items-center rounded-full border border-primary bg-primary px-2 py-0.5 font-mulish text-[10px] font-bold text-primary-foreground">
              {viewer.tokenLabel}
            </span>
          )}
        </div>
      </div>
      <span className="flex-1 text-right font-mulish text-[11px] text-text-muted md:flex-none md:text-sm">
        {viewer.date}
      </span>
    </div>
  );
}

export function SelectiveDisclosureModal() {
  const { open, setOpen } = useSelectiveDisclosureModal();
  const { enabled: devMode } = useDevMode();

  const [viewerAddress, setViewerAddress] = useState("");
  const [scope, setScope] = useState<ScopeType>("specific");
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setViewerAddress("");
      setScope("specific");
      setSelectedTokens(new Set());
      setCopied(false);
    }
  }, [setOpen]);

  const handleScopeChange = useCallback((newScope: ScopeType) => {
    setScope(newScope);
    if (newScope === "full") {
      setSelectedTokens(new Set(confidentialTokens.map((t) => t.symbol)));
    } else {
      setSelectedTokens(new Set());
    }
  }, []);

  const toggleToken = useCallback(
    (symbol: string) => {
      if (scope === "full") return;
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

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(ALLOW_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(viewerAddress);
  const hasTokenSelected = selectedTokens.size > 0;
  const canGrant = isValidAddress && hasTokenSelected;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-[calc(100%-2rem)] gap-[18px] overflow-y-auto overflow-x-hidden rounded-[32px] border-modal-border bg-modal-bg px-6 py-[34px] shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)] duration-300 no-scrollbar data-[state=open]:slide-in-from-bottom-8 data-[state=closed]:slide-out-to-bottom-8 motion-reduce:data-[state=open]:slide-in-from-bottom-0 motion-reduce:data-[state=closed]:slide-out-to-bottom-0 sm:max-w-[784px]"
        showCloseButton={false}
      >
        {/* Top bar: Dev mode toggle (left) + Close button (right) */}
        <div className="flex w-full items-center justify-between">
          <DevModeToggle label="Dev Mode" />
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="cursor-pointer font-mulish text-xl text-text-heading transition-opacity hover:opacity-70"
            aria-label="Close"
          >
            X
          </button>
        </div>

        {/* Header */}
        <div className="w-full text-center">
          <DialogTitle className="font-mulish text-[32px] font-bold leading-10 tracking-[-0.9px] text-text-heading md:text-[36px]">
            Selective Disclosure
          </DialogTitle>
          <DialogDescription className="mt-4 font-mulish text-lg leading-[29.25px] text-text-body">
            Grant third parties the ability to audit your confidential
            transactions without giving up control of your assets.
          </DialogDescription>
        </div>

        {/* Add a New Viewer — glass card */}
        <div className="flex w-full flex-col gap-5 rounded-3xl border border-surface-border bg-surface p-5 backdrop-blur-sm md:gap-[35px]">
          <div className="flex items-center justify-between">
            <h3 className="font-mulish text-xl font-bold text-text-heading">
              Add a New Viewer
            </h3>
            <span aria-hidden="true" className="material-icons text-[16px]! text-primary md:hidden">
              visibility
            </span>
          </div>

          <div className="flex flex-col items-center gap-[26px]">
            {/* Viewer Address */}
            <div className="flex w-full flex-col gap-[11px]">
              <label htmlFor="viewer-address" className="font-mulish text-sm font-bold text-text-body">
                Viewer Address
              </label>
              <input
                id="viewer-address"
                type="text"
                placeholder="0x..."
                value={viewerAddress}
                onChange={(e) => setViewerAddress(e.target.value)}
                className="h-[50px] w-full rounded-xl border border-surface-border bg-surface px-4 font-mulish text-base text-text-heading outline-none transition-colors placeholder:text-text-heading/60 focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>

            {/* Scope of Access */}
            <div className="flex w-full flex-col gap-[15px]">
              <span className="font-mulish text-sm font-bold text-text-body">
                Scope of Access
              </span>

              <div className="flex flex-col gap-5 md:grid md:grid-cols-2" role="radiogroup" aria-label="Scope of access">
                {/* Full Portfolio */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={scope === "full"}
                  onClick={() => handleScopeChange("full")}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-[17px] backdrop-blur-sm transition-colors ${
                    scope === "full"
                      ? "border-primary bg-primary-alpha-18"
                      : "border-surface-border bg-surface"
                  }`}
                >
                  <div
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      scope === "full"
                        ? "border-primary bg-primary"
                        : "border-surface-border"
                    }`}
                  >
                    {scope === "full" && (
                      <div className="size-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-mulish text-sm font-bold text-text-heading">
                      Full Portfolio
                    </p>
                    <p className="font-mulish text-xs text-text-muted">
                      Access all confidential history
                    </p>
                  </div>
                </button>

                {/* Specific Token */}
                <button
                  type="button"
                  role="radio"
                  aria-checked={scope === "specific"}
                  onClick={() => handleScopeChange("specific")}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-[17px] backdrop-blur-sm transition-colors ${
                    scope === "specific"
                      ? "border-primary bg-primary-alpha-18"
                      : "border-surface-border bg-surface"
                  }`}
                >
                  <div
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${
                      scope === "specific"
                        ? "border-primary bg-primary"
                        : "border-surface-border"
                    }`}
                  >
                    {scope === "specific" && (
                      <div className="size-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-mulish text-sm font-bold text-text-heading">
                      Specific Token
                    </p>
                    <p className="font-mulish text-xs text-text-muted">
                      Select one asset only
                    </p>
                  </div>
                </button>
              </div>

              {/* Token list */}
              <div className="flex flex-col gap-2">
                <span className="font-mulish text-sm font-bold text-text-body">
                  Select Token to be disclosed
                </span>

                {confidentialTokens.map((token) => {
                  const isChecked = selectedTokens.has(token.symbol);
                  const baseSymbol = token.symbol.replace(/^c/, "");
                  return (
                    <button
                      key={token.symbol}
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleToken(token.symbol)}
                      disabled={scope === "full"}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-surface-border bg-surface px-[17px] py-2 transition-colors hover:opacity-80 disabled:cursor-default disabled:opacity-70"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex size-4 shrink-0 items-center justify-center border ${
                            isChecked
                              ? "border-primary bg-primary"
                              : "border-surface-border"
                          }`}
                        >
                          {isChecked && (
                            <span aria-hidden="true" className="material-icons text-[12px]! text-primary-foreground">
                              check
                            </span>
                          )}
                        </div>
                        <span className="font-mulish text-base text-text-heading/60">
                          {baseSymbol}
                        </span>
                      </div>
                      <span className="font-mulish text-sm text-text-heading/60">
                        {token.address && token.address !== "0x..."
                          ? `${token.address.slice(0, 6)}...${token.address.slice(-4)}`
                          : "0x12Z456...."}
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
              className="flex w-[181px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-[18px] py-3 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="font-mulish text-base font-bold text-primary-foreground">
                Grant Access
              </span>
            </button>
          </div>

          {/* How it works — inside glass card on mobile */}
          <div className="flex w-full gap-4 rounded-2xl border border-surface-border bg-surface px-3 py-2.5 backdrop-blur-lg md:p-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary md:size-10">
              <span aria-hidden="true" className="material-icons text-[14px]! text-primary-foreground md:text-[24px]!">
                info
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mulish text-sm font-bold text-text-heading">
                How it works
              </p>
              <p className="mt-1 font-mulish text-xs leading-[19.5px] text-text-body">
                Selective disclosure shares a handle or balance at a given moment.
                The recipient can access data tied to that specific state only.
              </p>
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
              {ALLOW_CODE}
            </pre>
          </div>
        )}

        {/* Current Viewers */}
        <div className="flex w-full items-center justify-between">
          <span className="font-mulish text-base font-bold uppercase tracking-[1.4px] text-text-muted">
            Current Viewers ({CURRENT_VIEWERS.length})
          </span>
          <button
            type="button"
            aria-disabled="true"
            className="cursor-default font-mulish text-sm font-medium text-primary opacity-50"
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
            <span className="font-mulish text-base font-bold uppercase tracking-[1.4px] text-text-muted">
              Past Viewers ({PAST_VIEWERS.length})
            </span>
            <button
              type="button"
              aria-disabled="true"
              className="cursor-default font-mulish text-sm font-medium text-primary opacity-50"
            >
              See all
            </button>
          </div>

          {PAST_VIEWERS.map((viewer) => (
            <ViewerCard key={viewer.address + viewer.icon} viewer={viewer} />
          ))}
        </div>

        {/* Security Note */}
        <div className="flex w-full items-start gap-3 rounded-xl bg-modal-bg p-2.5 backdrop-blur-sm">
          <span aria-hidden="true" className="material-icons shrink-0 text-[24px]! text-tx-pending-text">
            info
          </span>
          <div className="flex flex-col gap-1 py-0.5 text-xs md:flex-row md:items-center md:gap-2.5">
            <span className="font-mulish font-bold text-text-heading">
              Security Note:
            </span>
            <span className="font-mulish text-text-body">
              Access is state-bound.
              Any new transaction that updates the handle automatically invalidates prior access.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { formatUnits } from "viem";
import { Card } from "@/components/ui/card";
import {
  useConfidentialBalances,
  type ConfidentialBalance,
} from "@/hooks/use-confidential-balances";
import { useHandleClient } from "@/hooks/use-handle-client";

export function ConfidentialAssets() {
  const { balances, isLoading } = useConfidentialBalances();
  const { handleClient } = useHandleClient();
  const initializedTokens = balances.filter((b) => b.isInitialized);

  return (
    <Card className="gap-0 rounded-3xl border-surface-border bg-asset-card-bg py-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="material-icons text-[18px]! text-text-heading"
          >
            visibility_off
          </span>
          <p className="font-mulish text-sm font-bold text-asset-text-secondary">
            Confidential Assets
          </p>
        </div>
        <p className="font-mulish text-xs text-text-muted">
          Encrypted on-chain
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center border-t border-surface-border px-6 py-10">
          <span
            aria-hidden="true"
            className="material-icons animate-spin text-[24px]! text-text-muted"
          >
            sync
          </span>
        </div>
      ) : initializedTokens.length > 0 ? (
        initializedTokens.map((token) => (
          <ConfidentialTokenRow
            key={token.symbol}
            token={token}
            handleClient={handleClient}
          />
        ))
      ) : (
        <div className="flex flex-col items-center gap-3 border-t border-surface-border px-6 py-10">
          <span
            aria-hidden="true"
            className="material-icons text-[32px]! text-asset-text-tertiary"
          >
            enhanced_encryption
          </span>
          <p className="font-mulish text-sm text-text-muted">
            No confidential assets yet.
          </p>
          <p className="max-w-md text-center font-mulish text-xs leading-5 text-asset-text-tertiary">
            Wrap your public tokens to create confidential assets. Your balances
            will be encrypted on-chain and hidden from block explorers.
          </p>
        </div>
      )}
    </Card>
  );
}

type DecryptState = "hidden" | "decrypting" | "revealed";

function ConfidentialTokenRow({
  token,
  handleClient,
}: {
  token: ConfidentialBalance;
  handleClient: ReturnType<typeof useHandleClient>["handleClient"];
}) {
  const [decryptState, setDecryptState] = useState<DecryptState>("hidden");
  const [decryptedAmount, setDecryptedAmount] = useState<string | null>(null);

  const handleDecrypt = useCallback(async () => {
    if (!handleClient || decryptState !== "hidden") return;

    setDecryptState("decrypting");

    try {
      const { value } = await handleClient.decrypt(token.handle);

      const formatted = formatUnits(typeof value === "bigint" ? value : BigInt(String(value)), token.decimals);
      setDecryptedAmount(formatted);
      setDecryptState("revealed");
    } catch {
      setDecryptState("hidden");
    }
  }, [handleClient, decryptState, token]);

  const handleToggle = useCallback(() => {
    if (decryptState === "revealed") {
      setDecryptState("hidden");
    } else if (decryptState === "hidden") {
      handleDecrypt();
    }
  }, [decryptState, handleDecrypt]);

  const isRevealed = decryptState === "revealed" && decryptedAmount !== null;
  const isDecrypting = decryptState === "decrypting";

  return (
    <div className="flex items-center justify-between border-t border-surface-border px-6 py-5">
      {/* Left: icon + name with eye toggle */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary">
          <Image
            src={token.icon}
            alt={`${token.name} icon`}
            width={18}
            height={18}
            className="size-4.5 object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="font-mulish text-base font-bold leading-6 text-text-heading">
              {token.name}
            </p>
            <button
              type="button"
              onClick={handleToggle}
              disabled={isDecrypting || !handleClient}
              className="cursor-pointer transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={isRevealed ? "Hide balance" : "Reveal balance"}
            >
              <span
                className={`material-icons text-[14px]! text-text-heading ${isDecrypting ? "animate-pulse motion-reduce:animate-none" : ""}`}
              >
                {isRevealed ? "visibility" : "visibility_off"}
              </span>
            </button>
          </div>
          <p className="font-mulish text-xs font-medium leading-4 text-text-muted">
            {token.symbol}
          </p>
        </div>
      </div>

      {/* Right: balance (masked or revealed) */}
      <div className="text-right">
        {isDecrypting ? (
          <div className="flex items-center justify-end gap-2">
            <span className="material-icons animate-spin motion-reduce:animate-none text-[16px]! text-text-muted">
              sync
            </span>
            <p className="font-mulish text-sm text-text-muted">Decrypting...</p>
          </div>
        ) : isRevealed ? (
          <p className="font-mulish text-lg font-bold leading-7 tracking-[0.45px] text-text-heading">
            {decryptedAmount} {token.symbol}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-end gap-1">
              <p className="font-mulish text-lg font-bold tracking-[0.45px] text-text-heading">
                ******{token.symbol}
              </p>
              <span
                aria-hidden="true"
                className="material-icons text-[14px]! text-text-muted"
              >
                enhanced_encryption
              </span>
            </div>
            <p className="font-mulish text-sm leading-5 text-text-muted">
              $*******
            </p>
          </>
        )}
      </div>
    </div>
  );
}

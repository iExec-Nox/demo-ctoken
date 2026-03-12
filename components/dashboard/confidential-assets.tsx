'use client';

import { Card } from '@/components/ui/card';
import {
  useConfidentialBalances,
  type ConfidentialBalance,
} from '@/hooks/use-confidential-balances';
import { useHandleClient } from '@/hooks/use-handle-client';
import type { TokenPrices } from '@/hooks/use-token-prices';
import { formatUsd } from '@/lib/format';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { formatUnits } from 'viem';

interface ConfidentialAssetsProps {
  prices: TokenPrices;
}

export function ConfidentialAssets({ prices }: ConfidentialAssetsProps) {
  const { balances, isLoading } = useConfidentialBalances();
  const { handleClient } = useHandleClient();
  const initializedTokens = balances.filter((b) => b.isInitialized);

  return (
    <Card className="dark:border-surface-border dark:bg-asset-card-bg gap-0 rounded-3xl border-[rgba(255,255,255,0.76)] bg-[rgba(255,255,255,0.08)] py-0 shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="material-icons text-primary text-[18px]!"
          >
            lock
          </span>
          <p className="font-mulish text-text-heading text-sm font-bold tracking-[1.4px]">
            Confidential Assets
          </p>
        </div>
        <p className="font-mulish text-text-body text-xs">Encrypted on-chain</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="dark:border-surface-border flex items-center justify-center border-t border-white px-6 py-10">
          <span
            aria-hidden="true"
            className="material-icons text-text-muted animate-spin text-[24px]!"
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
            prices={prices}
          />
        ))
      ) : (
        <div className="dark:border-surface-border flex flex-col items-center gap-3 border-t border-white px-6 py-10">
          <span
            aria-hidden="true"
            className="material-icons text-asset-text-tertiary text-[32px]!"
          >
            enhanced_encryption
          </span>
          <p className="font-mulish text-text-muted text-sm">
            No confidential assets yet.
          </p>
          <p className="font-mulish text-asset-text-tertiary max-w-md text-center text-xs leading-5">
            Wrap your public tokens to create confidential assets. Your balances
            will be encrypted on-chain and hidden from block explorers.
          </p>
        </div>
      )}
    </Card>
  );
}

type DecryptState = 'hidden' | 'decrypting' | 'revealed';

function ConfidentialTokenRow({
  token,
  handleClient,
  prices,
}: {
  token: ConfidentialBalance;
  handleClient: ReturnType<typeof useHandleClient>['handleClient'];
  prices: TokenPrices;
}) {
  const [decryptState, setDecryptState] = useState<DecryptState>('hidden');
  const [decryptedAmount, setDecryptedAmount] = useState<string | null>(null);

  const handleDecrypt = useCallback(async () => {
    if (!handleClient || decryptState !== 'hidden') return;

    setDecryptState('decrypting');

    try {
      const { value } = await handleClient.decrypt(token.handle);

      const formatted = formatUnits(
        typeof value === 'bigint' ? value : BigInt(String(value)),
        token.decimals
      );
      setDecryptedAmount(formatted);
      setDecryptState('revealed');
    } catch {
      setDecryptState('hidden');
    }
  }, [handleClient, decryptState, token]);

  const handleToggle = useCallback(() => {
    if (decryptState === 'revealed') {
      setDecryptState('hidden');
    } else if (decryptState === 'hidden') {
      handleDecrypt();
    }
  }, [decryptState, handleDecrypt]);

  const isRevealed = decryptState === 'revealed' && decryptedAmount !== null;
  const isDecrypting = decryptState === 'decrypting';

  return (
    <div className="dark:border-surface-border flex items-center justify-between border-t border-white px-6 py-5">
      {/* Left: icon + name with eye toggle */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="bg-primary flex size-8 items-center justify-center rounded-full">
          <Image
            src={token.icon}
            alt={`${token.name} icon`}
            width={18}
            height={18}
            className="size-4.5 object-contain"
          />
        </div>
        <div>
          <p className="font-mulish text-text-heading text-base leading-6 font-bold">
            {token.name}
          </p>
          <p className="font-mulish text-text-body text-xs leading-4 font-medium">
            {token.symbol}
          </p>
        </div>
      </div>

      {/* Right: balance (masked or revealed) */}
      <div className="text-right">
        {isDecrypting ? (
          <div className="flex items-center justify-end gap-2">
            <span className="material-icons text-text-muted animate-spin text-[16px]! motion-reduce:animate-none">
              sync
            </span>
            <p className="font-mulish text-text-muted text-sm">Decrypting...</p>
          </div>
        ) : isRevealed ? (
          <>
            <p className="font-mulish text-text-heading text-lg leading-7 font-bold tracking-[0.45px]">
              {decryptedAmount} {token.symbol}
            </p>
            {(() => {
              const baseSymbol = token.symbol.replace(/^c/, '');
              const price = prices[baseSymbol];
              if (price && decryptedAmount) {
                return (
                  <p className="font-mulish text-text-body text-sm leading-5">
                    {formatUsd(parseFloat(decryptedAmount) * price)}
                  </p>
                );
              }
              return null;
            })()}
          </>
        ) : (
          <>
            <div className="flex items-center justify-end gap-1">
              <p className="font-mulish text-text-heading text-lg font-bold tracking-[0.45px]">
                ******{token.symbol}
              </p>
              <button
                type="button"
                onClick={handleToggle}
                disabled={isDecrypting || !handleClient}
                className="cursor-pointer transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Reveal balance"
              >
                <span className="material-icons text-text-muted text-[14px]!">
                  visibility_off
                </span>
              </button>
            </div>
            <p className="font-mulish text-text-muted text-sm leading-5">
              $*******
            </p>
          </>
        )}
      </div>
    </div>
  );
}

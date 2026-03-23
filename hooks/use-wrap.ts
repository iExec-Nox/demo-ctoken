"use client";

import { useState, useCallback } from "react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { useWriteTransaction } from "@/hooks/use-write-transaction";
import { erc20Abi, parseUnits } from "viem";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import { estimateGasOverrides } from "@/lib/gas";
import { formatTransactionError } from "@/lib/utils";
import { useInvalidateBalances } from "@/hooks/use-invalidate-balances";
import { TEE_COOLDOWN_MS } from "@/lib/config";
import { pushGtmEvent } from "@/lib/gtm";
import type { TokenConfig } from "@/lib/tokens";

export type WrapStep = "idle" | "approving" | "wrapping" | "confirmed" | "error";

interface UseWrapResult {
  step: WrapStep;
  error: string | null;
  approveTxHash: `0x${string}` | undefined;
  wrapTxHash: `0x${string}` | undefined;
  wrap: (token: TokenConfig, amount: string) => Promise<boolean>;
  reset: () => void;
}

export function useWrap(): UseWrapResult {
  const { address, smartAccountAddress, type } = useWalletAuth();
  // For SCA: transactions execute from smart account, so cTokens must go there
  const onChainAddress = type === "sca" ? smartAccountAddress : address;

  const [step, setStep] = useState<WrapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const [wrapTxHash, setWrapTxHash] = useState<`0x${string}` | undefined>();

  const { writeTransaction, waitForReceipt, publicClient } = useWriteTransaction();
  const invalidateBalances = useInvalidateBalances();

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setApproveTxHash(undefined);
    setWrapTxHash(undefined);
  }, []);

  const wrap = useCallback(
    async (token: TokenConfig, amount: string) => {
      if (!onChainAddress) {
        setError("Wallet not connected");
        setStep("error");
        return false;
      }

      if (!token.address || !token.confidentialAddress) {
        setError("Token addresses not configured");
        setStep("error");
        return false;
      }

      const parsedAmount = parseUnits(amount, token.decimals);

      if (parsedAmount === 0n) {
        setError("Amount must be greater than zero");
        setStep("error");
        return false;
      }

      const erc20Address = token.address as `0x${string}`;
      const cTokenAddress = token.confidentialAddress as `0x${string}`;

      try {
        // Step 1: Approve exact amount on ERC-20
        setStep("approving");
        setError(null);

        const gasOverrides = await estimateGasOverrides(publicClient);

        const approveTx = await writeTransaction({
          address: erc20Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [cTokenAddress, parsedAmount],
          gasOverrides,
        });

        setApproveTxHash(approveTx);
        await waitForReceipt(approveTx);

        // Small cooldown — NoxCompute rate-limits rapid successive calls
        await new Promise((r) => setTimeout(r, TEE_COOLDOWN_MS));

        // Step 2: Wrap on cToken contract
        setStep("wrapping");

        const wrapTx = await writeTransaction({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: "wrap",
          args: [onChainAddress, parsedAmount],
          gasOverrides: await estimateGasOverrides(publicClient),
        });

        setWrapTxHash(wrapTx);
        await waitForReceipt(wrapTx);

        setStep("confirmed");
        pushGtmEvent("cdefi_wrap");
        invalidateBalances();
        return true;
      } catch (err) {
        setError(formatTransactionError(err));
        setStep("error");
        return false;
      }
    },
    [onChainAddress, writeTransaction, waitForReceipt, publicClient, invalidateBalances],
  );

  return { step, error, approveTxHash, wrapTxHash, wrap, reset };
}

"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import { useInvalidateBalances } from "@/hooks/use-invalidate-balances";
import type { TokenConfig } from "@/lib/tokens";

export type WrapStep = "idle" | "approving" | "wrapping" | "confirmed" | "error";

interface UseWrapResult {
  step: WrapStep;
  error: string | null;
  approveTxHash: `0x${string}` | undefined;
  wrapTxHash: `0x${string}` | undefined;
  wrap: (token: TokenConfig, amount: string) => Promise<void>;
  reset: () => void;
}

export function useWrap(): UseWrapResult {
  const { address } = useAccount();
  const [step, setStep] = useState<WrapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>();
  const [wrapTxHash, setWrapTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const invalidateBalances = useInvalidateBalances();

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setApproveTxHash(undefined);
    setWrapTxHash(undefined);
  }, []);

  const wrap = useCallback(
    async (token: TokenConfig, amount: string) => {
      if (!address) {
        setError("Wallet not connected");
        setStep("error");
        return;
      }

      if (!token.address || !token.confidentialAddress) {
        setError("Token addresses not configured");
        setStep("error");
        return;
      }

      const parsedAmount = parseUnits(amount, token.decimals);
      const erc20Address = token.address as `0x${string}`;
      const cTokenAddress = token.confidentialAddress as `0x${string}`;

      console.log("[useWrap] Starting wrap flow", {
        token: token.symbol,
        amount,
        parsedAmount: parsedAmount.toString(),
        decimals: token.decimals,
        erc20: erc20Address,
        cToken: cTokenAddress,
        user: address,
      });

      try {
        // Helper: fetch fresh EIP-1559 fees with a 20% buffer.
        // MetaMask under-estimates gas on Arbitrum Sepolia, so we must override.
        const freshGas = async () => {
          if (!publicClient) return {};
          const fees = await publicClient.estimateFeesPerGas();
          return {
            maxFeePerGas: (fees.maxFeePerGas * 120n) / 100n,
            maxPriorityFeePerGas: (fees.maxPriorityFeePerGas * 120n) / 100n,
          };
        };

        // Step 1: Approve exact amount on ERC-20
        setStep("approving");
        setError(null);

        console.log("[useWrap] Step 1: Approving", {
          spender: cTokenAddress,
          amount: parsedAmount.toString(),
        });

        const approveTx = await writeContractAsync({
          address: erc20Address,
          abi: erc20Abi,
          functionName: "approve",
          args: [cTokenAddress, parsedAmount],
          ...(await freshGas()),
        });

        console.log("[useWrap] Approve tx sent:", approveTx);
        setApproveTxHash(approveTx);

        // Wait for approve to be mined before calling wrap — the on-chain
        // allowance must be effective for the wrap to succeed
        await publicClient!.waitForTransactionReceipt({ hash: approveTx });

        // Step 2: Wrap on cToken contract (re-estimate gas fresh)
        setStep("wrapping");

        console.log("[useWrap] Step 2: Wrapping", {
          to: address,
          amount: parsedAmount.toString(),
        });

        const wrapTx = await writeContractAsync({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: "wrap",
          args: [address, parsedAmount],
          ...(await freshGas()),
        });

        console.log("[useWrap] Wrap tx sent:", wrapTx);
        setWrapTxHash(wrapTx);

        setStep("confirmed");
        invalidateBalances();
        console.log("[useWrap] Wrap complete!");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transaction failed";

        // Clean up user rejection messages
        const isUserRejection =
          message.includes("User rejected") ||
          message.includes("user rejected") ||
          message.includes("denied");

        const displayMessage = isUserRejection
          ? "Transaction rejected by user"
          : message.length > 200
            ? message.slice(0, 200) + "..."
            : message;

        console.error("[useWrap] Error:", err);
        setError(displayMessage);
        setStep("error");
      }
    },
    [address, writeContractAsync, publicClient],
  );

  return { step, error, approveTxHash, wrapTxHash, wrap, reset };
}

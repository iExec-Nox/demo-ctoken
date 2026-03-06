"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
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
        // Fetch current EIP-1559 fees from the network and add a 20% buffer.
        // The user never pays maxFeePerGas — it's a ceiling. Actual cost = baseFee + priorityFee.
        // The buffer prevents "maxFeePerGas < baseFee" errors when baseFee fluctuates between blocks.
        let gasOverrides: { maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint } = {};
        if (publicClient) {
          const fees = await publicClient.estimateFeesPerGas();
          const maxFeePerGas = (fees.maxFeePerGas * 120n) / 100n;
          const maxPriorityFeePerGas = (fees.maxPriorityFeePerGas * 120n) / 100n;
          gasOverrides = { maxFeePerGas, maxPriorityFeePerGas };
          console.log("[useWrap] Gas fees (network + 20% buffer)", {
            networkMaxFee: fees.maxFeePerGas.toString(),
            networkPriorityFee: fees.maxPriorityFeePerGas.toString(),
            appliedMaxFee: maxFeePerGas.toString(),
            appliedPriorityFee: maxPriorityFeePerGas.toString(),
          });
        }

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
          ...gasOverrides,
        });

        console.log("[useWrap] Approve tx sent:", approveTx);
        setApproveTxHash(approveTx);

        // Step 2: Wrap on cToken contract
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
          ...gasOverrides,
        });

        console.log("[useWrap] Wrap tx sent:", wrapTx);
        setWrapTxHash(wrapTx);

        setStep("confirmed");
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

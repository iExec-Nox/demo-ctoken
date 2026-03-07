"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, decodeEventLog } from "viem";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import { useHandleClient } from "@/hooks/use-handle-client";
import { useInvalidateBalances } from "@/hooks/use-invalidate-balances";
import type { TokenConfig } from "@/lib/tokens";

export type UnwrapStep =
  | "idle"
  | "encrypting"
  | "unwrapping"
  | "finalizing"
  | "confirmed"
  | "error";

interface UseUnwrapResult {
  step: UnwrapStep;
  error: string | null;
  /** True when finalizeUnwrap failed — tokens are in transit */
  isFinalizeError: boolean;
  unwrapTxHash: `0x${string}` | undefined;
  finalizeTxHash: `0x${string}` | undefined;
  unwrap: (token: TokenConfig, amount: string) => Promise<void>;
  retryFinalize: () => Promise<void>;
  reset: () => void;
}

export function useUnwrap(): UseUnwrapResult {
  const { address } = useAccount();
  const { handleClient } = useHandleClient();
  const [step, setStep] = useState<UnwrapStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isFinalizeError, setIsFinalizeError] = useState(false);
  const [unwrapTxHash, setUnwrapTxHash] = useState<`0x${string}` | undefined>();
  const [finalizeTxHash, setFinalizeTxHash] = useState<
    `0x${string}` | undefined
  >();

  // Store finalize params so retryFinalize can re-use them
  const finalizeParamsRef = useRef<{
    cTokenAddress: `0x${string}`;
    handle: `0x${string}`;
    parsedAmount: bigint;
  } | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const invalidateBalances = useInvalidateBalances();

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setIsFinalizeError(false);
    setUnwrapTxHash(undefined);
    setFinalizeTxHash(undefined);
    finalizeParamsRef.current = null;
  }, []);

  const estimateGas = useCallback(async () => {
    if (!publicClient) return {};
    const fees = await publicClient.estimateFeesPerGas();
    return {
      maxFeePerGas: (fees.maxFeePerGas * 120n) / 100n,
      maxPriorityFeePerGas: (fees.maxPriorityFeePerGas * 120n) / 100n,
    };
  }, [publicClient]);

  const executeFinalize = useCallback(
    async (
      cTokenAddress: `0x${string}`,
      handle: `0x${string}`,
      parsedAmount: bigint,
    ) => {
      setStep("finalizing");
      setError(null);
      setIsFinalizeError(false);

      const gasOverrides = await estimateGas();

      const finalizeTx = await writeContractAsync({
        address: cTokenAddress,
        abi: confidentialTokenAbi,
        functionName: "finalizeUnwrap",
        args: [handle, parsedAmount, "0x00"],
        ...gasOverrides,
      });

      setFinalizeTxHash(finalizeTx);
      setStep("confirmed");
      invalidateBalances();
      finalizeParamsRef.current = null;
    },
    [writeContractAsync, estimateGas, invalidateBalances],
  );

  const retryFinalize = useCallback(async () => {
    const params = finalizeParamsRef.current;
    if (!params) {
      setError("No pending finalization to retry");
      return;
    }

    try {
      await executeFinalize(params.cTokenAddress, params.handle, params.parsedAmount);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction failed";
      const isUserRejection =
        message.includes("User rejected") ||
        message.includes("user rejected") ||
        message.includes("denied");
      const displayMessage = isUserRejection
        ? "Transaction rejected by user"
        : message.length > 200
          ? message.slice(0, 200) + "..."
          : message;

      console.error("[useUnwrap] Retry finalize error:", err);
      setError(displayMessage);
      setStep("error");
      setIsFinalizeError(true);
    }
  }, [executeFinalize]);

  const unwrap = useCallback(
    async (token: TokenConfig, amount: string) => {
      if (!address) {
        setError("Wallet not connected");
        setStep("error");
        return;
      }

      if (!token.confidentialAddress) {
        setError("Confidential token address not configured");
        setStep("error");
        return;
      }

      if (!handleClient) {
        setError("Handle client not initialized — please reconnect your wallet");
        setStep("error");
        return;
      }

      const parsedAmount = parseUnits(amount, token.decimals);
      const cTokenAddress = token.confidentialAddress as `0x${string}`;

      try {
        const gasOverrides = await estimateGas();

        // Step 1: Encrypt the amount via Handle Gateway
        setStep("encrypting");
        setError(null);
        setIsFinalizeError(false);

        const { handle, handleProof } = await handleClient.encryptInput(
          parsedAmount,
          "uint256",
          cTokenAddress,
        );

        // Step 2: Initiate unwrap (from and to = msg.sender)
        setStep("unwrapping");

        const unwrapTx = await writeContractAsync({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: "unwrap",
          args: [address, address, handle, handleProof],
          ...gasOverrides,
        });

        setUnwrapTxHash(unwrapTx);

        // Step 2b: Extract the contract-generated handle from UnwrapRequested event.
        // The contract creates a NEW handle via _burn() — it is NOT the encryptInput handle.
        // See ERC7984ERC20Wrapper._unwrap(): `euint256 unwrapAmount = _burn(from, amount)`
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: unwrapTx,
        });

        // Decode the UnwrapRequested event to get the contract's handle
        let finalizeHandle: `0x${string}` | null = null;

        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== cTokenAddress.toLowerCase()) continue;
          try {
            const decoded = decodeEventLog({
              abi: confidentialTokenAbi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === "UnwrapRequested") {
              finalizeHandle = (decoded.args as { amount: `0x${string}` }).amount;
              break;
            }
          } catch {
            // Not this event, skip
          }
        }

        if (!finalizeHandle) {
          throw new Error(
            "Could not find UnwrapRequested event in transaction logs — unwrap may have failed silently"
          );
        }

        // Store finalize params in case it fails and needs retry
        finalizeParamsRef.current = { cTokenAddress, handle: finalizeHandle, parsedAmount };

        // Step 3: Finalize unwrap
        await executeFinalize(cTokenAddress, finalizeHandle, parsedAmount);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Transaction failed";

        const isUserRejection =
          message.includes("User rejected") ||
          message.includes("user rejected") ||
          message.includes("denied");

        const displayMessage = isUserRejection
          ? "Transaction rejected by user"
          : message.length > 200
            ? message.slice(0, 200) + "..."
            : message;

        console.error("[useUnwrap] Error:", err);
        setError(displayMessage);
        setStep("error");
        // If unwrap tx was sent but finalize failed, flag it
        setIsFinalizeError(finalizeParamsRef.current !== null);
      }
    },
    [address, handleClient, writeContractAsync, publicClient, estimateGas, executeFinalize],
  );

  return {
    step,
    error,
    isFinalizeError,
    unwrapTxHash,
    finalizeTxHash,
    unwrap,
    retryFinalize,
    reset,
  };
}

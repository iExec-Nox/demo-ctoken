"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
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

  const verifyUnwrapRequest = useCallback(
    async (cTokenAddress: `0x${string}`, handle: `0x${string}`) => {
      if (!publicClient) return null;
      try {
        const requester = await publicClient.readContract({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: "unwrapRequester",
          args: [handle],
        });
        console.log("[useUnwrap] unwrapRequester(%s) =>", handle, requester);
        return requester;
      } catch (err) {
        console.error("[useUnwrap] unwrapRequester call failed:", err);
        return null;
      }
    },
    [publicClient],
  );

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

      // Diagnostic: verify the handle is registered before calling finalizeUnwrap
      const requester = await verifyUnwrapRequest(cTokenAddress, handle);
      console.log("[useUnwrap] ---- FINALIZE DEBUG ----");
      console.log("[useUnwrap] handle for finalizeUnwrap:", handle);
      console.log("[useUnwrap] handle length:", handle.length);
      console.log("[useUnwrap] clearAmount:", parsedAmount.toString());
      console.log("[useUnwrap] unwrapRequester result:", requester);
      console.log("[useUnwrap] requester === address(0)?", requester === "0x0000000000000000000000000000000000000000");
      console.log("[useUnwrap] ---- END DEBUG ----");

      if (requester === "0x0000000000000000000000000000000000000000") {
        console.warn("[useUnwrap] Handle NOT registered in _unwrapRequests — finalizeUnwrap will revert!");
        console.warn("[useUnwrap] The contract likely stores a different handle. Check unwrap tx logs.");
      }

      const finalizeTx = await writeContractAsync({
        address: cTokenAddress,
        abi: confidentialTokenAbi,
        functionName: "finalizeUnwrap",
        args: [handle, parsedAmount, "0x00"],
        ...gasOverrides,
      });

      console.log("[useUnwrap] FinalizeUnwrap tx sent:", finalizeTx);
      setFinalizeTxHash(finalizeTx);
      setStep("confirmed");
      invalidateBalances();
      finalizeParamsRef.current = null;
      console.log("[useUnwrap] Unwrap complete!");
    },
    [writeContractAsync, estimateGas, verifyUnwrapRequest],
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

      console.log("[useUnwrap] Starting unwrap flow", {
        token: token.symbol,
        amount,
        parsedAmount: parsedAmount.toString(),
        decimals: token.decimals,
        cToken: cTokenAddress,
        user: address,
      });

      try {
        const gasOverrides = await estimateGas();

        // Step 1: Encrypt the amount via Handle Gateway
        setStep("encrypting");
        setError(null);
        setIsFinalizeError(false);

        console.log("[useUnwrap] Step 1: Encrypting amount via Gateway");

        const { handle, handleProof } = await handleClient.encryptInput(
          parsedAmount,
          "uint256",
          cTokenAddress,
        );

        console.log("[useUnwrap] encryptInput result:", {
          handle,
          handleProofLength: handleProof.length,
        });

        // Step 2: Initiate unwrap (from and to = msg.sender)
        setStep("unwrapping");

        console.log("[useUnwrap] Step 2: Initiating unwrap", {
          from: address,
          to: address,
        });

        const unwrapTx = await writeContractAsync({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: "unwrap",
          args: [address, address, handle, handleProof],
          ...gasOverrides,
        });

        console.log("[useUnwrap] Unwrap tx sent:", unwrapTx);
        setUnwrapTxHash(unwrapTx);

        // Wait for unwrap tx to be mined before finalizing
        let finalizeHandle: `0x${string}` = handle;

        if (publicClient) {
          console.log("[useUnwrap] Waiting for unwrap tx confirmation...");
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: unwrapTx,
          });
          console.log("[useUnwrap] Unwrap tx confirmed in block", receipt.blockNumber);

          // Extract the real handle from cRLC contract logs.
          // The contract creates an internal handle during unwrap() and stores it
          // in _unwrapRequests — this is NOT the same as the encryptInput handle.
          // We scan logs from the cRLC address for a bytes32 data value,
          // then verify it with unwrapRequester().
          const cTokenLogs = receipt.logs.filter(
            (log) => log.address.toLowerCase() === cTokenAddress.toLowerCase() && log.data.length === 66
          );

          console.log("[useUnwrap] cRLC logs with bytes32 data:", cTokenLogs.length);

          for (const log of cTokenLogs) {
            const candidateHandle = log.data as `0x${string}`;
            const requester = await verifyUnwrapRequest(cTokenAddress, candidateHandle);
            if (requester && requester !== "0x0000000000000000000000000000000000000000") {
              console.log("[useUnwrap] Found registered handle in logs:", candidateHandle);
              console.log("[useUnwrap] Registered for address:", requester);
              finalizeHandle = candidateHandle;
              break;
            }
          }

          if (finalizeHandle === handle) {
            console.warn("[useUnwrap] Could not find a different registered handle in logs — using encryptInput handle as fallback");
          } else {
            console.log("[useUnwrap] Using handle from contract logs instead of encryptInput handle");
            console.log("[useUnwrap]   encryptInput handle:", handle);
            console.log("[useUnwrap]   contract handle:    ", finalizeHandle);
          }
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

"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import {
  noxComputeAbi,
  NOX_COMPUTE_ADDRESS,
} from "@/lib/nox-compute-abi";
import type { TokenConfig } from "@/lib/tokens";

const ZERO_HANDLE = ("0x" + "0".repeat(64)) as `0x${string}`;

export type AddViewerStep =
  | "idle"
  | "reading-handle"
  | "granting"
  | "confirmed"
  | "error";

interface UseAddViewerResult {
  step: AddViewerStep;
  error: string | null;
  txHash: `0x${string}` | undefined;
  grant: (
    viewerAddress: string,
    tokens: TokenConfig[],
  ) => Promise<void>;
  reset: () => void;
}

export function useAddViewer(): UseAddViewerResult {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [step, setStep] = useState<AddViewerStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(undefined);
  }, []);

  const grant = useCallback(
    async (viewerAddress: string, tokens: TokenConfig[]) => {
      if (!address) {
        setError("Wallet not connected");
        setStep("error");
        return;
      }

      if (!publicClient) {
        setError("Public client not available");
        setStep("error");
        return;
      }

      const viewer = viewerAddress as `0x${string}`;

      try {
        // Gas overrides with 20% buffer
        const fees = await publicClient.estimateFeesPerGas();
        const gasOverrides = {
          maxFeePerGas: (fees.maxFeePerGas * 120n) / 100n,
          maxPriorityFeePerGas: (fees.maxPriorityFeePerGas * 120n) / 100n,
        };

        // Step 1: Read balance handles for each selected token
        setStep("reading-handle");
        setError(null);

        const handleEntries: { token: TokenConfig; handle: `0x${string}` }[] =
          [];

        for (const token of tokens) {
          const cTokenAddress = token.confidentialAddress as
            | `0x${string}`
            | undefined;

          if (!cTokenAddress || cTokenAddress === "0x...") continue;

          const balanceHandle = await publicClient.readContract({
            address: cTokenAddress,
            abi: confidentialTokenAbi,
            functionName: "confidentialBalanceOf",
            args: [address],
          });

          if (balanceHandle && balanceHandle !== ZERO_HANDLE) {
            handleEntries.push({ token, handle: balanceHandle });
          }
        }

        if (handleEntries.length === 0) {
          setError(
            "No confidential balance found for the selected token(s). Wrap tokens first.",
          );
          setStep("error");
          return;
        }

        // Step 2: Call addViewer for each handle
        setStep("granting");

        let lastTxHash: `0x${string}` | undefined;

        for (const { handle } of handleEntries) {
          const tx = await writeContractAsync({
            address: NOX_COMPUTE_ADDRESS,
            abi: noxComputeAbi,
            functionName: "addViewer",
            args: [handle, viewer],
            ...gasOverrides,
          });

          lastTxHash = tx;
        }

        setTxHash(lastTxHash);
        setStep("confirmed");
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

        console.error("[useAddViewer] Error:", err);
        setError(displayMessage);
        setStep("error");
      }
    },
    [address, publicClient, writeContractAsync],
  );

  return { step, error, txHash, grant, reset };
}

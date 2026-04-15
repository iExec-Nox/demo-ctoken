"use client";

import { useState, useCallback } from "react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { useWriteTransaction } from "@/hooks/use-write-transaction";
import { parseUnits, isAddress } from "viem";
import { confidentialTokenAbi } from "@/lib/confidential-token-abi";
import { estimateGasOverrides } from "@/lib/gas";
import { formatTransactionError } from "@/lib/utils";
import { useHandleClient } from "@/hooks/use-handle-client";
import { useInvalidateBalances } from "@/hooks/use-invalidate-balances";
import { pushGtmEvent } from "@/lib/gtm";
import type { TokenConfig } from "@/lib/tokens";

export type TransferStep =
  | "idle"
  | "encrypting"
  | "transferring"
  | "confirmed"
  | "error";

interface UseConfidentialTransferResult {
  step: TransferStep;
  error: string | null;
  txHash: `0x${string}` | undefined;
  transfer: (token: TokenConfig, amount: string, recipient: string) => Promise<boolean>;
  reset: () => void;
}

export function useConfidentialTransfer(): UseConfidentialTransferResult {
  const { address, smartAccountAddress, type } = useWalletAuth();
  const onChainAddress = type === "sca" ? smartAccountAddress : address;
  const { handleClient } = useHandleClient();
  const [step, setStep] = useState<TransferStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeTransaction, waitForReceipt, publicClient } = useWriteTransaction();
  const invalidateBalances = useInvalidateBalances();

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setTxHash(undefined);
  }, []);

  const transfer = useCallback(
    async (token: TokenConfig, amount: string, recipient: string) => {
      if (!onChainAddress) {
        setError("Wallet not connected");
        setStep("error");
        return false;
      }

      if (!token.confidentialAddress) {
        setError("Confidential token address not configured");
        setStep("error");
        return false;
      }

      if (!handleClient) {
        setError("Handle client not initialized — please reconnect your wallet");
        setStep("error");
        return false;
      }

      if (!isAddress(recipient)) {
        setError("Invalid recipient address");
        setStep("error");
        return false;
      }

      const parsedAmount = parseUnits(amount, token.decimals);

      if (parsedAmount === 0n) {
        setError("Amount must be greater than zero");
        setStep("error");
        return false;
      }

      const cTokenAddress = token.confidentialAddress as `0x${string}`;
      const recipientAddress = recipient as `0x${string}`;

      try {
        // Step 1: Encrypt the amount via Handle Gateway
        setStep("encrypting");
        setError(null);

        const { handle, handleProof } = await handleClient.encryptInput(
          parsedAmount,
          "uint256",
          cTokenAddress,
        );

        // Step 2: Confidential transfer
        setStep("transferring");

        const transferTx = await writeTransaction({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: "confidentialTransfer",
          args: [recipientAddress, handle, handleProof],
          gasOverrides: await estimateGasOverrides(publicClient),
        });

        setTxHash(transferTx);
        await waitForReceipt(transferTx);

        setStep("confirmed");
        pushGtmEvent("cdefi_transfer");
        invalidateBalances();
        return true;
      } catch (err) {
        setError(formatTransactionError(err));
        setStep("error");
        return false;
      }
    },
    [onChainAddress, handleClient, writeTransaction, waitForReceipt, publicClient, invalidateBalances],
  );

  return { step, error, txHash, transfer, reset };
}

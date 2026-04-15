"use client";

import { useCallback } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";
import {
  useSmartAccountClient,
  useSendUserOperation,
} from "@account-kit/react";
import { useWalletAuth, ACCOUNT_TYPE } from "@/hooks/use-wallet-auth";

interface WriteTransactionParams {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  /** Gas overrides for EOA path (ignored for SCA — bundler handles gas) */
  gasOverrides?: {
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  };
}

/**
 * Unified write transaction hook that works for both EOA (wagmi) and SCA (Account Kit).
 *
 * - EOA: uses wagmi `writeContractAsync` (direct tx)
 * - SCA: uses Account Kit's `useSmartAccountClient` + `useSendUserOperation`
 *   which handles the correct smart account address, nonce, and paymaster.
 *
 * Returns `writeTransaction(params)` which resolves to a tx hash in both cases.
 */
export function useWriteTransaction() {
  const { type } = useWalletAuth();
  const publicClient = usePublicClient();

  // EOA path
  const { writeContractAsync } = useWriteContract();

  // SCA path — Account Kit smart account client (uses ACCOUNT_TYPE for consistency)
  const { client: smartAccountClient } = useSmartAccountClient({
    type: ACCOUNT_TYPE,
  });

  const { sendUserOperationAsync } = useSendUserOperation({
    client: smartAccountClient,
    waitForTxn: true,
  });

  const writeTransaction = useCallback(
    async (params: WriteTransactionParams): Promise<`0x${string}`> => {
      if (type === "sca") {
        const data = encodeFunctionData({
          abi: params.abi,
          functionName: params.functionName,
          args: params.args ?? [],
        });

        const result = await sendUserOperationAsync({
          uo: {
            target: params.address,
            data,
            value: params.value ?? 0n,
          },
        });

        return result.hash;
      }

      // EOA path — use wagmi writeContractAsync
      return writeContractAsync({
        address: params.address,
        abi: params.abi as any,
        functionName: params.functionName,
        args: params.args as any,
        value: params.value,
        ...params.gasOverrides,
      });
    },
    [type, writeContractAsync, sendUserOperationAsync],
  );

  const waitForReceipt = useCallback(
    async (hash: `0x${string}`) => {
      if (!publicClient) throw new Error("Public client not available");
      return publicClient.waitForTransactionReceipt({ hash });
    },
    [publicClient],
  );

  return { writeTransaction, waitForReceipt, publicClient };
}

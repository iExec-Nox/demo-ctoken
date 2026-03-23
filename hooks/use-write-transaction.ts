"use client";

import { useCallback, useRef, useEffect } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { type Abi, encodeFunctionData } from "viem";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { arbitrumSepolia } from "viem/chains";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { createLightAccount, createAlchemyPublicClient, ALCHEMY_RPC_URL } from "@/lib/smart-account";
import { CONFIG } from "@/lib/config";
import { http } from "viem";

interface WriteTransactionParams {
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  /** Gas overrides for EOA path (ignored for SCA — bundler handles gas) */
  gasOverrides?: {
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- bundlerClient type is complex and version-dependent
type BundlerClient = any;

/**
 * Unified write transaction hook that works for both EOA (wagmi) and SCA (bundler).
 *
 * - EOA: uses wagmi `writeContractAsync` (direct tx)
 * - SCA: encodes calldata, creates a LightSmartAccount from the Alchemy signer,
 *   and sends via bundlerClient.sendUserOperation (standard ERC-4337 bundler API)
 *
 * Returns `writeTransaction(params)` which resolves to a tx hash in both cases.
 */
export function useWriteTransaction() {
  const { type, address: userAddress } = useWalletAuth();
  const publicClient = usePublicClient();

  // EOA path
  const { writeContractAsync } = useWriteContract();

  // SCA path — bundler client ref (created lazily on first SCA tx)
  const bundlerRef = useRef<{
    bundlerClient: BundlerClient | null;
    accountAddress: string | null;
  }>({ bundlerClient: null, accountAddress: null });

  // Reset bundler client when user changes
  useEffect(() => {
    if (!userAddress || type !== "sca") {
      bundlerRef.current = { bundlerClient: null, accountAddress: null };
    }
  }, [userAddress, type]);

  const getBundlerClient = useCallback(async (): Promise<BundlerClient> => {
    // Return cached if same user
    if (
      bundlerRef.current.bundlerClient &&
      bundlerRef.current.accountAddress === userAddress
    ) {
      return bundlerRef.current.bundlerClient;
    }

    if (!userAddress) throw new Error("No user address");

    const viemClient = createAlchemyPublicClient();
    const lightAccount = await createLightAccount();

    const paymasterClient = createPaymasterClient({
      transport: http(ALCHEMY_RPC_URL),
    });

    const bundlerClient = createBundlerClient({
      account: lightAccount,
      client: viemClient,
      chain: arbitrumSepolia,
      paymaster: paymasterClient,
      paymasterContext: { policyId: CONFIG.alchemy.policyId },
      transport: http(ALCHEMY_RPC_URL),
      userOperation: {
        async estimateFeesPerGas() {
          const block = await viemClient.getBlock({ blockTag: "latest" });
          const baseFee = block.baseFeePerGas ?? 0n;
          const minPriorityFee = 2_000_000n; // ~2 gwei floor for Arbitrum
          return {
            maxPriorityFeePerGas: minPriorityFee,
            maxFeePerGas: baseFee * 2n + minPriorityFee,
          };
        },
      },
    });

    bundlerRef.current = { bundlerClient, accountAddress: userAddress };
    return bundlerClient;
  }, [userAddress]);

  const writeTransaction = useCallback(
    async (params: WriteTransactionParams): Promise<`0x${string}`> => {
      if (type === "sca") {
        const data = encodeFunctionData({
          abi: params.abi,
          functionName: params.functionName,
          args: params.args ?? [],
        });

        const bundlerClient = await getBundlerClient();

        const hash = await bundlerClient.sendUserOperation({
          calls: [{ to: params.address, data, value: params.value ?? 0n }],
        });

        const receipt = await bundlerClient.waitForUserOperationReceipt({
          hash,
          timeout: 120_000,
        });

        return receipt.receipt.transactionHash;
      }

      // EOA path — use wagmi writeContractAsync
      return writeContractAsync({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args as unknown[],
        value: params.value,
        ...params.gasOverrides,
      });
    },
    [type, writeContractAsync, getBundlerClient],
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

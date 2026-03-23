"use client";

import { useCallback, useRef, useEffect } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import {
  createPublicClient,
  encodeFunctionData,
  http,
} from "viem";
import { arbitrumSepolia } from "viem/chains";
import {
  createBundlerClient,
  createPaymasterClient,
  entryPoint06Address,
} from "viem/account-abstraction";
import { toLightSmartAccount } from "permissionless/accounts";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { CONFIG } from "@/lib/config";

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
    bundlerClient: ReturnType<typeof createBundlerClient> | null;
    accountAddress: string | null;
  }>({ bundlerClient: null, accountAddress: null });

  // Reset bundler client when user changes
  useEffect(() => {
    if (!userAddress || type !== "sca") {
      bundlerRef.current = { bundlerClient: null, accountAddress: null };
    }
  }, [userAddress, type]);

  const getBundlerClient = useCallback(async () => {
    // Return cached if same user
    if (
      bundlerRef.current.bundlerClient &&
      bundlerRef.current.accountAddress === userAddress
    ) {
      return bundlerRef.current.bundlerClient;
    }

    if (!userAddress) throw new Error("No user address");

    const alchemyRpcUrl = `https://arb-sepolia.g.alchemy.com/v2/${CONFIG.alchemy.apiKey}`;

    const viemClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(alchemyRpcUrl),
    });

    // Get the Alchemy signer from Account Kit's internal store
    // and convert it to a viem LocalAccount for permissionless compatibility
    const { alchemyConfig } = await import("@/lib/alchemy");
    const signer = alchemyConfig.store.getState().signer;

    if (!signer) {
      throw new Error("Alchemy signer not available — please reconnect");
    }

    // toViemAccount() converts the AlchemySigner to a viem LocalAccount
    const owner = signer.toViemAccount();

    // Create a LightSmartAccount using the signer as owner
    const lightAccount = await toLightSmartAccount({
      client: viemClient,
      owner,
      version: "1.1.0",
      entryPoint: {
        address: entryPoint06Address,
        version: "0.6",
      },
    });

    const paymasterClient = createPaymasterClient({
      transport: http(alchemyRpcUrl),
    });

    const bundlerClient = createBundlerClient({
      account: lightAccount,
      client: viemClient,
      chain: arbitrumSepolia,
      paymaster: paymasterClient,
      paymasterContext: {
        policyId: CONFIG.alchemy.policyId,
      },
      transport: http(alchemyRpcUrl),
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

    bundlerRef.current = {
      bundlerClient: bundlerClient as any,
      accountAddress: userAddress,
    };

    return bundlerClient as any;
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
          calls: [
            {
              to: params.address,
              data,
              value: params.value ?? 0n,
            },
          ],
        });

        // Wait for the UserOperation to be included in a block
        const receipt = await bundlerClient.waitForUserOperationReceipt({
          hash,
          timeout: 120_000,
        });

        return receipt.receipt.transactionHash;
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

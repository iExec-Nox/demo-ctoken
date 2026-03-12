'use client';

import { useHandleClient } from '@/hooks/use-handle-client';
import { useInvalidateBalances } from '@/hooks/use-invalidate-balances';
import { confidentialTokenAbi } from '@/lib/confidential-token-abi';
import { estimateGasOverrides } from '@/lib/gas';
import type { TokenConfig } from '@/lib/tokens';
import { formatTransactionError } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { parseUnits, isAddress } from 'viem';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';

export type TransferStep =
  | 'idle'
  | 'encrypting'
  | 'transferring'
  | 'confirmed'
  | 'error';

interface UseConfidentialTransferResult {
  step: TransferStep;
  error: string | null;
  txHash: `0x${string}` | undefined;
  transfer: (
    token: TokenConfig,
    amount: string,
    recipient: string
  ) => Promise<void>;
  reset: () => void;
}

export function useConfidentialTransfer(): UseConfidentialTransferResult {
  const { address } = useAccount();
  const { handleClient } = useHandleClient();
  const [step, setStep] = useState<TransferStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync, reset: resetWriteContract } = useWriteContract();
  const publicClient = usePublicClient();
  const invalidateBalances = useInvalidateBalances();

  const reset = useCallback(() => {
    setStep('idle');
    setError(null);
    setTxHash(undefined);
    resetWriteContract();
  }, [resetWriteContract]);

  const transfer = useCallback(
    async (token: TokenConfig, amount: string, recipient: string) => {
      if (!address) {
        setError('Wallet not connected');
        setStep('error');
        return;
      }

      if (!token.confidentialAddress) {
        setError('Confidential token address not configured');
        setStep('error');
        return;
      }

      if (!handleClient) {
        setError(
          'Handle client not initialized — please reconnect your wallet'
        );
        setStep('error');
        return;
      }

      if (!isAddress(recipient)) {
        setError('Invalid recipient address');
        setStep('error');
        return;
      }

      const parsedAmount = parseUnits(amount, token.decimals);

      if (parsedAmount === 0n) {
        setError('Amount must be greater than zero');
        setStep('error');
        return;
      }

      const cTokenAddress = token.confidentialAddress as `0x${string}`;
      const recipientAddress = recipient as `0x${string}`;

      try {
        const gasOverrides = await estimateGasOverrides(publicClient);

        // Step 1: Encrypt the amount via Handle Gateway
        setStep('encrypting');
        setError(null);

        const { handle, handleProof } = await handleClient.encryptInput(
          parsedAmount,
          'uint256',
          cTokenAddress
        );

        // Step 2: Confidential transfer
        setStep('transferring');

        const transferTx = await writeContractAsync({
          address: cTokenAddress,
          abi: confidentialTokenAbi,
          functionName: 'confidentialTransfer',
          args: [recipientAddress, handle, handleProof],
          ...gasOverrides,
        });

        setTxHash(transferTx);

        // Wait for transfer tx to be mined before marking confirmed
        await publicClient!.waitForTransactionReceipt({ hash: transferTx });

        setStep('confirmed');
        invalidateBalances();
      } catch (err) {
        setError(formatTransactionError(err));
        setStep('error');
      }
    },
    [
      address,
      handleClient,
      writeContractAsync,
      publicClient,
      invalidateBalances,
    ]
  );

  return { step, error, txHash, transfer, reset };
}

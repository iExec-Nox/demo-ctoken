"use client";

import { useBalance, useReadContracts, useAccount, useChainId } from "wagmi";
import { erc20Abi } from "viem";
import tokens from "@/lib/tokens.json";

export interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  balance: bigint;
  formatted: string;
}

const erc20Tokens = tokens.filter((t) => !t.isNative && t.address);
const nativeToken = tokens.find((t) => t.isNative);

export function useTokenBalances() {
  const { address, isConnected, status } = useAccount();
  const chainId = useChainId();
  const isReady = isConnected && !!address;
  const isReconnecting = status === "reconnecting" || status === "connecting";

  const {
    data: nativeBalance,
    isLoading: isNativeLoading,
  } = useBalance({
    address,
    chainId,
    query: { enabled: isReady },
  });

  const {
    data: erc20Results,
    isLoading: isErc20Loading,
  } = useReadContracts({
    contracts: erc20Tokens.map((token) => ({
      address: token.address as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address!],
      chainId,
    })),
    query: { enabled: isReady },
  });

  const balances: TokenBalance[] = [];

  if (nativeToken) {
    const raw = nativeBalance?.value ?? 0n;
    balances.push({
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      decimals: nativeToken.decimals,
      icon: nativeToken.icon,
      balance: raw,
      formatted: formatBalance(raw, nativeToken.decimals),
    });
  }

  erc20Tokens.forEach((token, i) => {
    const result = erc20Results?.[i];
    const raw = result?.status === "success" ? (result.result as bigint) : 0n;
    balances.push({
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      icon: token.icon,
      balance: raw,
      formatted: formatBalance(raw, token.decimals),
    });
  });

  const hasAnyBalance = balances.some((b) => b.balance > 0n);
  const isLoading = isReconnecting || isNativeLoading || isErc20Loading;

  return { balances, hasAnyBalance, isLoading };
}

function formatBalance(value: bigint, decimals: number): string {
  if (value === 0n) return "0";
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const remainder = value % divisor;
  const fractional = remainder.toString().padStart(decimals, "0").slice(0, 4);
  const trimmed = fractional.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

import tokensData from "./tokens.json";

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  address?: string;
  icon: string;
  coingeckoId?: string;
}

export const tokens: TokenConfig[] = tokensData;

export const erc20Tokens = tokens.filter(
  (t): t is TokenConfig & { address: string } => !t.isNative && !!t.address
);

export const nativeToken = tokens.find((t) => t.isNative);

export const coingeckoIds = tokens
  .map((t) => t.coingeckoId)
  .filter(Boolean)
  .join(",");

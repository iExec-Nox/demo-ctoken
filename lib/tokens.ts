export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  isNative?: boolean;
  address?: string;
  icon: string;
  coingeckoId?: string;
  wrappable?: boolean;
  confidentialAddress?: string;
}

export const tokens: TokenConfig[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    isNative: true,
    icon: "/icon-eth.svg",
    coingeckoId: "ethereum",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    address: "0xf3C3351D6Bd0098EEb33ca8f830FAf2a141Ea2E1",
    icon: "/icon-usdc.svg",
    coingeckoId: "usd-coin",
    wrappable: true,
    confidentialAddress: "0x...", // TODO: replace with deployed cUSDC address
  },
  {
    symbol: "RLC",
    name: "iExec RLC",
    decimals: 9,
    address: "0x9923eD3cbd90CD78b910c475f9A731A6e0b8C963",
    icon: "/icon-rlc.svg",
    coingeckoId: "iexec-rlc",
    wrappable: true,
    confidentialAddress: "0x271f46e78f2fe59817854dabde47729ac4935765",
  },
];

export const erc20Tokens = tokens.filter(
  (t): t is TokenConfig & { address: string } => !t.isNative && !!t.address,
);

export const nativeToken = tokens.find(t => t.isNative);

export const wrappableTokens = erc20Tokens.filter(t => t.wrappable);

export const confidentialTokens = wrappableTokens.map(t => ({
  ...t,
  symbol: `c${t.symbol}`,
  name: `Confidential ${t.name}`,
  address: t.confidentialAddress,
}));

export const coingeckoIds = tokens
  .map(t => t.coingeckoId)
  .filter(Boolean)
  .join(",");

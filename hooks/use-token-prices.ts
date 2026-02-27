"use client";

import { useState, useEffect, useCallback } from "react";
import tokens from "@/lib/tokens.json";

const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";
const REFRESH_INTERVAL = 60_000; // 60s

const coingeckoIds = tokens
  .map((t) => t.coingeckoId)
  .filter(Boolean)
  .join(",");

/** Maps token symbol → USD price */
export type TokenPrices = Record<string, number>;

export function useTokenPrices() {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `${COINGECKO_API}?ids=${coingeckoIds}&vs_currencies=usd`
      );
      if (!res.ok) return;
      const data = await res.json();

      const mapped: TokenPrices = {};
      for (const token of tokens) {
        if (token.coingeckoId && data[token.coingeckoId]?.usd) {
          mapped[token.symbol] = data[token.coingeckoId].usd;
        }
      }
      setPrices(mapped);
    } catch {
      // silently fail — prices are non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, isLoading };
}

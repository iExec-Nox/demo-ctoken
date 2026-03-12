'use client';

import { useState, useEffect } from 'react';

const REFRESH_INTERVAL = 60_000;

export type TokenPrices = Record<string, number>;

export function useTokenPrices() {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices', {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data: TokenPrices = await res.json();
        setPrices(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return { prices, isLoading };
}

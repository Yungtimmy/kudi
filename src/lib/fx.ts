/** Fixed naira fallback when no live FX feed can be read. Display only. */
export const FALLBACK_NGN_PER_USD = 1600;

/** How long the server keeps one CoinGecko answer, to stay inside the free rate limit. */
export const FX_CACHE_MS = 60 * 1000;

export type FxQuote = {
  ngnPerUsd: number;
  /** When the feed itself last updated the rate, not when we fetched it. */
  asOf: string;
  source: "live" | "fallback";
  /** Which feed the number came from. */
  provider: "coingecko" | "er-api" | "fixed";
};

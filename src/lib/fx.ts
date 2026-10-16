/** Fixed naira fallback when the live FX feed cannot be read. Display only. */
export const FALLBACK_NGN_PER_USD = 1600;

export type FxQuote = {
  ngnPerUsd: number;
  asOf: string;
  source: "live" | "fallback";
};

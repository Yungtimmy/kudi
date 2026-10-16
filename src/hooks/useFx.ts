"use client";

import { useQuery } from "@tanstack/react-query";
import { FALLBACK_NGN_PER_USD, type FxQuote } from "@/lib/fx";

export function useFx() {
  const query = useQuery({
    queryKey: ["kudi", "fx", "ngn"],
    queryFn: async (): Promise<FxQuote> => {
      const res = await fetch("/api/fx");
      if (!res.ok) throw new Error("fx");
      const data = (await res.json()) as FxQuote;
      if (!Number.isFinite(data.ngnPerUsd) || data.ngnPerUsd <= 0) throw new Error("fx");
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (query.data) return { ...query.data, loading: false };
  if (query.isError) {
    return {
      ngnPerUsd: FALLBACK_NGN_PER_USD,
      asOf: new Date().toISOString(),
      source: "fallback" as const,
      loading: false,
    };
  }
  return {
    ngnPerUsd: FALLBACK_NGN_PER_USD,
    asOf: new Date().toISOString(),
    source: "fallback" as const,
    loading: true,
  };
}

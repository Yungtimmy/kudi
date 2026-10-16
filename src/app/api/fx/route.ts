import { FALLBACK_NGN_PER_USD, type FxQuote } from "@/lib/fx";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as {
      rates?: { NGN?: number };
      time_last_update_unix?: number;
    };
    const ngn = Number(data.rates?.NGN);
    if (!Number.isFinite(ngn) || ngn <= 0) throw new Error("rate");
    const asOf = data.time_last_update_unix
      ? new Date(data.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString();
    const body: FxQuote = { ngnPerUsd: ngn, asOf, source: "live" };
    return Response.json(body);
  } catch {
    const body: FxQuote = {
      ngnPerUsd: FALLBACK_NGN_PER_USD,
      asOf: new Date().toISOString(),
      source: "fallback",
    };
    return Response.json(body);
  }
}

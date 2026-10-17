import { FALLBACK_NGN_PER_USD, FX_CACHE_MS, type FxQuote } from "@/lib/fx";

export const dynamic = "force-dynamic";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd,ngn&include_last_updated_at=true";
const ER_API_URL = "https://open.er-api.com/v6/latest/USD";

// One cached answer per server instance. CoinGecko's free public API has no key
// and a low rate limit, so every visitor shares the same reading for a minute.
let cached: { quote: FxQuote; at: number } | null = null;

function isRate(n: number) {
  return Number.isFinite(n) && n > 0;
}

/** MUSD tracks USD, so naira per USD is tether's NGN price over its USD price. */
async function fromCoinGecko(): Promise<FxQuote> {
  const res = await fetch(COINGECKO_URL, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const data = (await res.json()) as {
    tether?: { usd?: number; ngn?: number; last_updated_at?: number };
  };
  const ngn = Number(data.tether?.ngn);
  const usd = Number(data.tether?.usd);
  if (!isRate(ngn) || !isRate(usd)) throw new Error("coingecko rate");
  const updated = Number(data.tether?.last_updated_at);
  return {
    ngnPerUsd: ngn / usd,
    asOf: isRate(updated) ? new Date(updated * 1000).toISOString() : new Date().toISOString(),
    source: "live",
    provider: "coingecko",
  };
}

/** The old daily feed, kept as a backup. */
async function fromErApi(): Promise<FxQuote> {
  const res = await fetch(ER_API_URL, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`er-api ${res.status}`);
  const data = (await res.json()) as {
    rates?: { NGN?: number };
    time_last_update_unix?: number;
  };
  const ngn = Number(data.rates?.NGN);
  if (!isRate(ngn)) throw new Error("er-api rate");
  return {
    ngnPerUsd: ngn,
    asOf: data.time_last_update_unix
      ? new Date(data.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString(),
    source: "live",
    provider: "er-api",
  };
}

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.at < FX_CACHE_MS) return Response.json(cached.quote);

  for (const read of [fromCoinGecko, fromErApi]) {
    try {
      const quote = await read();
      // Cache whichever feed answered, so CoinGecko is asked again after a minute either way.
      cached = { quote, at: now };
      return Response.json(quote);
    } catch {
      // try the next feed
    }
  }

  // Keep showing the last good live rate rather than dropping to the fixed number.
  if (cached) return Response.json(cached.quote);

  const body: FxQuote = {
    ngnPerUsd: FALLBACK_NGN_PER_USD,
    asOf: new Date().toISOString(),
    source: "fallback",
    provider: "fixed",
  };
  return Response.json(body);
}

// Mezo Passport (OrangeKit) hardcodes its relay URLs and has no option to
// change them. MezoTransactionSender POSTs to these from the browser:
//   https://test.mezo.org/api/v2/relay/deploy-safe   (first BTC-wallet tx: deploys the Safe)
//   https://test.mezo.org/api/v2/relay/transactions  (relayed Safe txs)
// The relay has no CORS headers, so the browser blocks those calls. We send
// them to /api/mezo-relay/* on our own server, which forwards them to Mezo.

export const MEZO_RELAY_UPSTREAM = "https://test.mezo.org/api/v2/relay/";
export const MEZO_RELAY_PATHS = ["deploy-safe", "transactions"] as const;
const LOCAL_PREFIX = "/api/mezo-relay/";

/** Returns the local proxy URL for a Mezo testnet relay URL, or null for anything else. */
export function toLocalRelayUrl(url: string): string | null {
  if (!url.startsWith(MEZO_RELAY_UPSTREAM)) return null;
  const rest = url.slice(MEZO_RELAY_UPSTREAM.length).split(/[?#]/)[0];
  if (!(MEZO_RELAY_PATHS as readonly string[]).includes(rest)) return null;
  return `${LOCAL_PREFIX}${rest}`;
}

let installed = false;

/** Wraps window.fetch once so only Mezo relay calls go through our server. */
export function installMezoRelayFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const local = toLocalRelayUrl(url);
    if (!local) return original(input, init);
    if (typeof input === "string" || input instanceof URL) return original(local, init);
    return original(new Request(local, input), init);
  };
}

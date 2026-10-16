import type { Connector } from "wagmi";

/**
 * UniSat's getAccounts is documented as a string and sometimes comes back
 * empty while wagmi still holds the Mezo safe address from an earlier connect.
 * OrangeKit then does `accounts[0]` and predicts the safe. An empty list makes
 * that address undefined, and the predictor calls toLowerCase on it before
 * any wallet popup.
 */
type InjectedBitcoin = {
  getAccounts?: () => Promise<unknown>;
  requestAccounts?: () => Promise<unknown>;
};

type BitcoinConnector = Connector & {
  getBitcoinAddress?: () => Promise<string | undefined>;
  getBitcoinProvider?: () => { connect?: () => Promise<unknown> };
};

const patched = new WeakSet<object>();
const remembered = new WeakMap<object, string>();

export class WalletNotConnectedError extends Error {
  constructor() {
    super("Connect your wallet first");
    this.name = "WalletNotConnectedError";
  }
}

/** A Bitcoin address is long. The first character of a string is not one. */
export function bitcoinAddresses(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 20 ? [trimmed] : [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 20)
    .map((item) => item.trim());
}

function looksLikeBitcoinAddress(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 20 && !value.trim().startsWith("0x");
}

function injectedProvider(id?: string): InjectedBitcoin | undefined {
  const scope = globalThis as {
    unisat?: InjectedBitcoin;
    okxwallet?: { bitcoin?: InjectedBitcoin };
  };
  if (id === "orangekit-unisat") return scope.unisat;
  if (id === "orangekit-okx") return scope.okxwallet?.bitcoin;
  return undefined;
}

/** Make getAccounts return a string array, falling back to the address just approved. */
export function rememberBitcoinAccount(provider: InjectedBitcoin, address: string) {
  remembered.set(provider, address);
  if (patched.has(provider) || typeof provider.getAccounts !== "function") return;
  const original = provider.getAccounts.bind(provider);
  provider.getAccounts = async () => {
    const listed = bitcoinAddresses(await original());
    if (listed.length > 0) return listed;
    const cached = remembered.get(provider);
    return cached ? [cached] : [];
  };
  patched.add(provider);
}

/**
 * Bitcoin wallets (UniSat, OKX) must have a real Bitcoin address before a write.
 * EVM connectors have no getBitcoinAddress and are left alone.
 */
export async function ensureBitcoinAccount(connector: Connector | undefined): Promise<void> {
  const bitcoin = connector as BitcoinConnector | undefined;
  if (typeof bitcoin?.getBitcoinAddress !== "function") return;

  const current = await bitcoin.getBitcoinAddress().catch(() => undefined);
  if (looksLikeBitcoinAddress(current)) return;
  const injected = injectedProvider(bitcoin.id);

  if (injected?.getAccounts) {
    const listed = bitcoinAddresses(await injected.getAccounts());
    if (listed[0]) {
      rememberBitcoinAccount(injected, listed[0]);
      return;
    }
  }

  if (injected?.requestAccounts) {
    const requested = bitcoinAddresses(await injected.requestAccounts());
    if (!requested[0]) throw new WalletNotConnectedError();
    rememberBitcoinAccount(injected, requested[0]);
    return;
  }

  const connected = await bitcoin.getBitcoinProvider?.().connect?.();
  const address = bitcoinAddresses(connected)[0];
  if (!address && !looksLikeBitcoinAddress(current)) throw new WalletNotConnectedError();
}

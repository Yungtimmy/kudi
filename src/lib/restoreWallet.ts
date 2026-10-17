import { getAddress, type Address } from "viem";
import type { Connector, Config } from "wagmi";
import { reconnect } from "wagmi/actions";

const BITCOIN_IDS = new Set(["orangekit-unisat", "orangekit-okx", "orangekit-xverse"]);
const wrapped = new WeakSet<object>();
const snapshots = new Map<string, { accounts: readonly Address[]; chainId: number }>();

type StoredConnection = {
  accounts?: readonly Address[];
  chainId?: number;
  connector?: { id?: string };
};

type PersistApi = {
  hasHydrated?: () => boolean;
  rehydrate?: () => Promise<void> | void;
};

function isBitcoinConnector(connector: Connector) {
  return BITCOIN_IDS.has(connector.id) || connector.type === "orangekit";
}

/** Installed means the extension object exists. This does not ask for accounts. */
export function bitcoinWalletInstalled(id: string) {
  const scope = globalThis as {
    unisat?: unknown;
    okxwallet?: { bitcoin?: unknown };
    XverseProviders?: { BitcoinProvider?: unknown };
  };
  if (id === "orangekit-unisat") return Boolean(scope.unisat);
  if (id === "orangekit-okx") return Boolean(scope.okxwallet?.bitcoin);
  if (id === "orangekit-xverse") return Boolean(scope.XverseProviders?.BitcoinProvider);
  return false;
}

function connectionEntries(connections: unknown): StoredConnection[] {
  if (connections instanceof Map) return Array.from(connections.values());
  if (connections && typeof connections === "object" && (connections as { __type?: string }).__type === "Map") {
    const value = (connections as { value?: unknown[] }).value ?? [];
    return value.map((entry) => (Array.isArray(entry) ? entry[1] : entry)) as StoredConnection[];
  }
  return [];
}

function rememberParsedStore(parsed: unknown) {
  const state = parsed && typeof parsed === "object" && "state" in parsed
    ? (parsed as { state?: { connections?: unknown } }).state
    : parsed && typeof parsed === "object" && "connections" in parsed
      ? parsed as { connections?: unknown }
      : null;
  const connections = state && "connections" in state ? state.connections : (state as { connections?: unknown } | null)?.connections;
  for (const entry of connectionEntries(connections)) {
    if (!entry?.connector?.id || !entry.accounts?.length || typeof entry.chainId !== "number") continue;
    snapshots.set(entry.connector.id, { accounts: entry.accounts, chainId: entry.chainId });
  }
}

/** wagmi's reconnect writes state before isAuthorized, which would erase these accounts. */
function rememberLocalSessions() {
  if (typeof localStorage === "undefined") return;
  const raw = localStorage.getItem("wagmi.store");
  if (!raw) return;
  try {
    rememberParsedStore(JSON.parse(raw));
  } catch {
    // Ignore a damaged store. The click path can still connect.
  }
}

/** Copy saved accounts into memory before reconnect overwrites localStorage. */
export async function rememberPersistedSessions(config: Config) {
  rememberLocalSessions();
  const stored = await config.storage?.getItem("store");
  if (stored) rememberParsedStore(stored);
}

function readRecentConnectorId(): string | undefined {
  if (typeof localStorage === "undefined") return undefined;
  const raw = localStorage.getItem("wagmi.recentConnectorId");
  if (!raw || raw === "null" || raw === "undefined") return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "string" && parsed ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Last safe address wagmi saved for the recent connector.
 * Readable on the first paint, before reconnect restores the live account.
 */
export function savedWalletAddress(): Address | undefined {
  rememberLocalSessions();
  const recent = readRecentConnectorId();
  const account = recent ? snapshots.get(recent)?.accounts[0] : undefined;
  if (!account) return undefined;
  try {
    return getAddress(account);
  } catch {
    return undefined;
  }
}

/** Last accounts wagmi saved for this connector. Empty UniSat getAccounts cannot supply these. */
export async function persistedConnection(config: Config, connectorId: string) {
  const stored = await config.storage?.getItem("store");
  const record = stored && typeof stored === "object"
    ? stored as { state?: { connections?: unknown }; connections?: unknown }
    : null;
  const connections = record?.state?.connections ?? record?.connections;
  for (const entry of connectionEntries(connections)) {
    if (entry?.connector?.id !== connectorId) continue;
    if (!entry.accounts?.length || typeof entry.chainId !== "number") continue;
    return { accounts: entry.accounts, chainId: entry.chainId };
  }
  return null;
}

/**
 * OrangeKit isAuthorized reads getAccounts(), which is empty after a reload.
 * Wagmi then skips the connector. A previous session can be restored without
 * requestAccounts, which is what would open the UniSat popup.
 */
export function allowSilentBitcoinReconnect(config: Config) {
  rememberLocalSessions();
  for (const connector of config.connectors) {
    if (!isBitcoinConnector(connector) || wrapped.has(connector)) continue;
    wrapped.add(connector);
    const originalAuthorized = connector.isAuthorized.bind(connector);
    const originalConnect = connector.connect.bind(connector);
    connector.isAuthorized = async () => {
      try {
        if (await originalAuthorized()) return true;
      } catch {
        // An empty account list makes the safe predictor throw before a popup.
      }
      if (!bitcoinWalletInstalled(connector.id)) return false;
      const recent = await config.storage?.getItem("recentConnectorId");
      if (recent !== connector.id) return false;
      return snapshots.has(connector.id);
    };
    connector.connect = async (parameters) => {
      const reconnecting = Boolean(
        parameters &&
          typeof parameters === "object" &&
          "isReconnecting" in parameters &&
          (parameters as { isReconnecting?: boolean }).isReconnecting,
      );
      if (reconnecting) {
        const stored = snapshots.get(connector.id);
        if (stored) return stored;
        throw new Error("No silent Bitcoin session");
      }
      return originalConnect(parameters as { chainId?: number });
    };
  }
}

/** Rehydrate localStorage, then reconnect only the last connector. */
export async function reconnectLastWallet(config: Config) {
  const persist = (config as unknown as { _internal?: { store?: { persist?: PersistApi } } })._internal?.store?.persist;
  if (persist?.hasHydrated && !persist.hasHydrated()) await persist.rehydrate?.();
  await rememberPersistedSessions(config);
  const recent = await config.storage?.getItem("recentConnectorId");
  const connector = typeof recent === "string" ? config.connectors.find((item) => item.id === recent) : undefined;
  if (connector) return reconnect(config, { connectors: [connector] });
  return reconnect(config);
}

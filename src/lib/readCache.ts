import { getAddress, type Address } from "viem";

const CACHE_KEY = "kudi.homeCache";

type RawCache = {
  price?: string;
  mcr?: string;
  address?: string;
  btc?: string;
  musd?: string;
  active?: boolean;
  coll?: string;
  debt?: string;
};

export type PositionCache = {
  address: Address;
  btc: bigint;
  musd: bigint;
  active: boolean;
  coll?: bigint;
  debt?: bigint;
};

function readRaw(): RawCache | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RawCache;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeRaw(patch: RawCache) {
  if (typeof localStorage === "undefined") return;
  const next = { ...readRaw(), ...patch };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // A full or blocked store still leaves the live figures on screen.
  }
}

function parseWei(value: unknown): bigint | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  return BigInt(value);
}

export function readCachedPrice(): bigint | undefined {
  return parseWei(readRaw()?.price);
}

export function readCachedMcr(): bigint | undefined {
  return parseWei(readRaw()?.mcr);
}

export function readCachedPosition(address: Address): PositionCache | null {
  const raw = readRaw();
  if (!raw?.address || raw.address.toLowerCase() !== address.toLowerCase()) return null;
  const btc = parseWei(raw.btc);
  const musd = parseWei(raw.musd);
  if (btc == null || musd == null || typeof raw.active !== "boolean") return null;
  let checksum: Address;
  try {
    checksum = getAddress(address);
  } catch {
    return null;
  }
  return {
    address: checksum,
    btc,
    musd,
    active: raw.active,
    coll: raw.active ? parseWei(raw.coll) : undefined,
    debt: raw.active ? parseWei(raw.debt) : undefined,
  };
}

export function writeCachedPrice(price: bigint) {
  writeRaw({ price: price.toString() });
}

export function writeCachedMcr(mcr: bigint) {
  writeRaw({ mcr: mcr.toString() });
}

export function writeCachedPosition(position: PositionCache) {
  writeRaw({
    address: position.address,
    btc: position.btc.toString(),
    musd: position.musd.toString(),
    active: position.active,
    coll: position.coll?.toString(),
    debt: position.debt?.toString(),
  });
}

import { WAD } from "./format";

export const ACTIVE_TROVE = 1;

/** 1e18 = 100%. */
export function wadToPct(wad: bigint): number {
  return Number((wad * 10000n) / WAD) / 100;
}

export function borrowingFee(amount: bigint, rateWad: bigint): bigint {
  return (amount * rateWad) / WAD;
}

export function previewDebt(opts: {
  amount: bigint;
  rateWad: bigint;
  currentDebt: bigint;
  gas: bigint;
  opening: boolean;
}): bigint {
  const fee = borrowingFee(opts.amount, opts.rateWad);
  return opts.currentDebt + opts.amount + fee + (opts.opening ? opts.gas : 0n);
}

/** Safe opening target. 200% sits above the 150% Safe line. */
export const SAFE_ICR_PCT = 200;
export const GUIDE_MAX_ICR_PCT = 300;

/** BTC (18 decimals) that places `debt` at `ratioPct` for this BTC price. */
export function collateralForRatio(debt: bigint, price: bigint, ratioPct: number): bigint | null {
  if (debt <= 0n || price <= 0n || !(ratioPct > 0)) return null;
  const ratioWad = BigInt(Math.round(ratioPct * 100)) * (WAD / 10000n);
  return (debt * ratioWad) / price;
}

/** Individual collateral ratio, in percent (150 = 150%). */
export function previewRatioPct(coll: bigint, price: bigint, debt: bigint): number | null {
  if (coll <= 0n || debt <= 0n || price <= 0n) return null;
  return wadToPct((coll * price) / debt);
}

/** BTC price, 18 decimals, at which this debt sits on the minimum collateral ratio. */
export function liquidationPrice(debt: bigint, coll: bigint, mcr: bigint): bigint | null {
  if (coll <= 0n || debt <= 0n || mcr <= 0n) return null;
  return (debt * mcr) / coll;
}

/**
 * Largest new MUSD amount that keeps the resulting debt inside the minimum
 * collateral ratio. The borrowing fee is included. Returns 0 when the
 * collateral cannot cover the gas reserve or the debt already open.
 */
export function maxDraw(opts: {
  coll: bigint;
  price: bigint;
  mcr: bigint;
  currentDebt: bigint;
  gas: bigint;
  rateWad: bigint;
  opening: boolean;
}): bigint {
  const { coll, price, mcr, currentDebt, gas, rateWad, opening } = opts;
  if (coll <= 0n || price <= 0n || mcr <= 0n) return 0n;
  const maxDebt = (coll * price) / mcr;
  const committed = currentDebt + (opening ? gas : 0n);
  if (maxDebt <= committed) return 0n;
  const room = maxDebt - committed;
  return (room * WAD) / (WAD + rateWad);
}

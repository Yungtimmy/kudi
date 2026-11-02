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
/** BTC kept back in the wallet for the network fee (0.0001 BTC). */
export const BTC_FEE_RESERVE = 10n ** 14n;
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

/**
 * Ceiling BorrowerOperations stores at open: `coll * price / 110%`.
 * The contract hardcodes 110% (110 * 1e16). It does not move when the oracle
 * moves. Adding collateral does not raise it. Withdrawing collateral can lower it.
 */
export const CAPACITY_DENOM = 110n * 10n ** 16n;

export function protocolMaxCapacity(coll: bigint, price: bigint): bigint {
  if (coll <= 0n || price <= 0n) return 0n;
  return (coll * price) / CAPACITY_DENOM;
}

/** MUSD still drawable so debt + new amount + fee stays within the stored ceiling. */
export function remainingBorrow(opts: { cap: bigint; debt: bigint; rateWad: bigint }): bigint {
  if (opts.cap <= opts.debt) return 0n;
  return ((opts.cap - opts.debt) * WAD) / (WAD + opts.rateWad);
}

export function borrowLimits(opts: {
  coll: bigint;
  price: bigint;
  mcr: bigint;
  debt: bigint;
  gas: bigint;
  rateWad: bigint;
  opening: boolean;
  storedCap?: bigint;
}): { icrRoom: bigint; capRoom: bigint | null; room: bigint; capBinds: boolean } {
  const icrRoom = maxDraw({
    coll: opts.coll,
    price: opts.price,
    mcr: opts.mcr,
    currentDebt: opts.opening ? 0n : opts.debt,
    gas: opts.gas,
    rateWad: opts.rateWad,
    opening: opts.opening,
  });
  if (opts.opening || opts.storedCap == null) {
    return { icrRoom, capRoom: null, room: icrRoom, capBinds: false };
  }
  const capRoom = remainingBorrow({ cap: opts.storedCap, debt: opts.debt, rateWad: opts.rateWad });
  const room = icrRoom < capRoom ? icrRoom : capRoom;
  // A 1 MUSD gap is rounding. A wider gap means the stored ceiling, not the live ratio, is the limit.
  return { icrRoom, capRoom, room, capBinds: capRoom + WAD < icrRoom };
}

/** Principal after a borrow. The fee is debt. Interest is not principal. */
export function principalAfterBorrow(principal: bigint, amount: bigint, fee: bigint): bigint {
  return principal + amount + fee;
}

/**
 * Repayment clears accrued interest first, then principal.
 * `debt` is principal plus interest, as `getTroveDebt` returns it.
 */
export function principalAfterRepay(principal: bigint, debt: bigint, repay: bigint): bigint {
  if (repay <= 0n) return principal;
  const interest = debt > principal ? debt - principal : 0n;
  if (repay <= interest) return principal;
  const fromPrincipal = repay - interest;
  return fromPrincipal >= principal ? 0n : principal - fromPrincipal;
}

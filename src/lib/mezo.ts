// Mezo testnet constants (Wave 1 build spec).
// Addresses match @mezo-org/musd-contracts@1.1.0 matsnet artifacts, except BTC and the pool router.
import { getAddress, isAddress, type Address } from "viem";

export const MEZO_TESTNET = {
  chainId: 31611,
  rpc: "https://rpc.test.mezo.org",
  explorer: "https://explorer.test.mezo.org",
  faucet: "https://faucet.test.mezo.org",
} as const;

export const CONTRACTS = {
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  BorrowerOperations: "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5",
  TroveManager: "0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0",
  PriceFeed: "0x86bCF0841622a5dAC14A313a15f96A95421b9366",
  HintHelpers: "0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6",
  SortedTroves: "0x722E4D24FD6Ff8b0AC679450F3D91294607268fA",
  InterestRateManager: "0xD4D6c36A592A2c5e86035A6bca1d57747a567f37",
  // Canonical testnet BTC. Its balanceOf matches the wallet's native BTC balance.
  BTC: "0x7b7C000000000000000000000000000000000000",
  SwapRouter: "0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9",
  MusdBtcPool: "0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9",
  PoolFactory: "0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A",
} as const satisfies Record<string, Address>;

export const LOAN_RULES = {
  feePct: 1,
  minCollateralPct: 110,
  minDebtMusd: 1800,
  recoveryPct: 150,
} as const;

export type Route = {
  from: Address;
  to: Address;
  stable: boolean;
  factory: Address;
};

export const btcToMusdRoute = (): Route[] => [
  {
    from: CONTRACTS.BTC,
    to: CONTRACTS.MUSD,
    stable: false,
    factory: CONTRACTS.PoolFactory,
  },
];

export const txUrl = (hash: string) => `${MEZO_TESTNET.explorer}/tx/${hash}`;

export const shortAddr = (a: string) => {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
};

/** Short form for the read-only bar: 0x10c8…D12f */
export const viewAddr = (a: string) => {
  if (!a || a.length < 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

/** `?address=` on home. Missing means the normal wallet home. */
export function parseViewAddress(raw: string | null): { address?: Address; invalid: boolean } {
  if (raw == null) return { invalid: false };
  const value = raw.trim();
  if (!isAddress(value)) return { invalid: true };
  return { address: getAddress(value), invalid: false };
}

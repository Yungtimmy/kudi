// Mezo testnet constants (from Wave 1 build spec)
export const MEZO_TESTNET = {
  chainId: 31611, rpc: "https://rpc.test.mezo.org",
  explorer: "https://explorer.test.mezo.org", faucet: "https://faucet.test.mezo.org",
} as const;
export const CONTRACTS = {
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  BorrowerOperations: "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5",
  TroveManager: "0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0",
  PriceFeed: "0x86bCF0841622a5dAC14A313a15f96A95421b9366",
  HintHelpers: "0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6",
  SwapRouter: "0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9",
  MusdBtcPool: "0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9",
} as const;
export const LOAN_RULES = { feePct: 1, minCollateralPct: 110, minDebtMusd: 1800 } as const;
export const txUrl = (hash: string) => `${MEZO_TESTNET.explorer}/tx/${hash}`;
export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

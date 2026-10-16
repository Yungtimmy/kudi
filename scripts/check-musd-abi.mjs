import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const mezo = readFileSync(new URL("src/lib/mezo.ts", root), "utf8");
const abiSrc = readFileSync(new URL("src/lib/abi.ts", root), "utf8");

function address(name) {
  const match = mezo.match(new RegExp(`${name}:\\s*"(0x[a-fA-F0-9]{40})"`));
  if (!match) throw new Error(`missing address ${name} in src/lib/mezo.ts`);
  return match[1];
}

function artifact(name) {
  return JSON.parse(readFileSync(new URL(`node_modules/@mezo-org/musd-contracts/deployments/matsnet/${name}.json`, root), "utf8"));
}

const linked = {
  MUSD: "MUSD",
  BorrowerOperations: "BorrowerOperations",
  TroveManager: "TroveManager",
  PriceFeed: "PriceFeed",
  HintHelpers: "HintHelpers",
  SortedTroves: "SortedTroves",
  InterestRateManager: "InterestRateManager",
};

for (const [key, file] of Object.entries(linked)) {
  const deployed = artifact(file).address;
  const local = address(key);
  if (deployed.toLowerCase() !== local.toLowerCase()) {
    throw new Error(`${key} ${local} does not match package ${deployed}`);
  }
}

const needed = {
  PriceFeed: ["fetchPrice"],
  TroveManager: ["MCR", "CCR", "MUSD_GAS_COMPENSATION", "getTroveColl", "getTroveDebt", "getTroveStatus", "getCurrentICR", "getTCR", "checkRecoveryMode", "getTroveInterestRate"],
  BorrowerOperations: ["minNetDebt", "borrowingRate", "getBorrowingFee", "openTrove", "adjustTrove"],
  HintHelpers: ["getApproxHint"],
  SortedTroves: ["findInsertPosition"],
  InterestRateManager: ["interestRate"],
  MUSD: ["balanceOf", "allowance", "approve", "transfer"],
};

for (const [file, names] of Object.entries(needed)) {
  const have = new Set(artifact(file).abi.filter((item) => item.type === "function").map((item) => item.name));
  for (const name of names) {
    if (!have.has(name)) throw new Error(`${file} artifact is missing ${name}`);
    if (!abiSrc.includes(`function ${name}`)) throw new Error(`src/lib/abi.ts is missing ${name}`);
  }
}

console.log("musd abi check ok");

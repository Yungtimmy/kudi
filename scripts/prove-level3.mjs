/**
 * Mezo testnet proof for Integration Level-3.
 *
 * Always reads the live oracle, ICR, max borrow, redemption rate, and a
 * MUSD/BTC pool quote from https://rpc.test.mezo.org (chain 31611).
 *
 * Broadcasts openTrove → addColl → repayMUSD → swapExactTokensForTokens
 * only when both of these are set:
 *   KUDI_PROOF_PRIVATE_KEY   hex private key, environment only, never printed
 *   KUDI_PROOF_SEND=1        confirms the broadcast
 *
 * The script refuses any chain id other than 31611. It does not read a
 * custom RPC URL, so it cannot be pointed at mainnet.
 */
import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, defineChain, formatUnits, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const RPC = "https://rpc.test.mezo.org";
const CHAIN_ID = 31611;
const EXPLORER = "https://explorer.test.mezo.org";
const ZERO = "0x0000000000000000000000000000000000000000";

const ADDR = {
  MUSD: getAddress("0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503"),
  BorrowerOperations: getAddress("0xCdF7028ceAB81fA0C6971208e83fa7872994beE5"),
  TroveManager: getAddress("0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0"),
  PriceFeed: getAddress("0x86bCF0841622a5dAC14A313a15f96A95421b9366"),
  HintHelpers: getAddress("0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6"),
  SortedTroves: getAddress("0x722E4D24FD6Ff8b0AC679450F3D91294607268fA"),
  BTC: getAddress("0x7b7C000000000000000000000000000000000000"),
  SwapRouter: getAddress("0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9"),
  PoolFactory: getAddress("0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A"),
};

const mezoTestnet = defineChain({
  id: CHAIN_ID,
  name: "Mezo Testnet",
  nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
  blockExplorers: { default: { name: "Mezo", url: EXPLORER } },
});

function artifactAbi(name) {
  const file = new URL(`../node_modules/@mezo-org/musd-contracts/deployments/matsnet/${name}.json`, import.meta.url);
  return JSON.parse(readFileSync(file, "utf8")).abi;
}

const abi = {
  PriceFeed: artifactAbi("PriceFeed"),
  TroveManager: artifactAbi("TroveManager"),
  BorrowerOperations: artifactAbi("BorrowerOperations"),
  HintHelpers: artifactAbi("HintHelpers"),
  SortedTroves: artifactAbi("SortedTroves"),
  MUSD: artifactAbi("MUSD"),
  BTC: artifactAbi("MUSD"),
  router: [
    {
      type: "function",
      name: "getAmountsOut",
      stateMutability: "view",
      inputs: [
        { name: "amountIn", type: "uint256" },
        {
          name: "routes",
          type: "tuple[]",
          components: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "stable", type: "bool" },
            { name: "factory", type: "address" },
          ],
        },
      ],
      outputs: [{ name: "amounts", type: "uint256[]" }],
    },
    {
      type: "function",
      name: "swapExactTokensForTokens",
      stateMutability: "nonpayable",
      inputs: [
        { name: "amountIn", type: "uint256" },
        { name: "amountOutMin", type: "uint256" },
        {
          name: "routes",
          type: "tuple[]",
          components: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "stable", type: "bool" },
            { name: "factory", type: "address" },
          ],
        },
        { name: "to", type: "address" },
        { name: "deadline", type: "uint256" },
      ],
      outputs: [{ name: "amounts", type: "uint256[]" }],
    },
  ],
};

const erc20 = artifactAbi("MUSD").filter((item) => ["balanceOf", "allowance", "approve"].includes(item.name) || item.type !== "function");

const client = createPublicClient({ chain: mezoTestnet, transport: http(RPC) });

const fmt = (wad, digits = 2) => formatUnits(wad, 18).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
const pct = (wad) => `${(Number(wad) / 1e16).toFixed(2)}%`;
const txLink = (hash) => `${EXPLORER}/tx/${hash}`;

function printBlocker(extra = "") {
  console.log(`
BLOCKER: this environment cannot sign the four Level-3 transactions.
Provide both:
  KUDI_PROOF_PRIVATE_KEY   hex private key of a Mezo testnet wallet (chain 31611). Read from the environment only. Never commit it.
  KUDI_PROOF_SEND=1        required before this script broadcasts anything.
Fund that wallet at https://faucet.test.mezo.org. A new 1,800 MUSD loan at 200% needs roughly 0.06 test BTC at the price printed above, plus a little more for the top-up and the pool swap.
${extra}
Until then, produce the explorer hashes in the Kudi UI. The steps are in docs/evidence.md.
`.trim());
}

async function redemptionHead(price, mcr) {
  let cursor = await client.readContract({ address: ADDR.SortedTroves, abi: abi.SortedTroves, functionName: "getLast" });
  for (let step = 0; step < 12 && cursor && cursor !== ZERO; step += 1) {
    const icr = await client.readContract({
      address: ADDR.TroveManager,
      abi: abi.TroveManager,
      functionName: "getCurrentICR",
      args: [cursor, price],
    });
    if (icr >= mcr) return { address: cursor, icr };
    cursor = await client.readContract({
      address: ADDR.SortedTroves,
      abi: abi.SortedTroves,
      functionName: "getPrev",
      args: [cursor],
    });
  }
  return null;
}

async function hints(coll, nominalDebt, exclude) {
  const nicr = (coll * 10n ** 20n) / nominalDebt;
  const size = await client.readContract({ address: ADDR.SortedTroves, abi: abi.SortedTroves, functionName: "getSize" });
  const trials = BigInt(Math.max(15, Math.ceil(Math.sqrt(Number(size))) * 15));
  const approx = await client.readContract({
    address: ADDR.HintHelpers,
    abi: abi.HintHelpers,
    functionName: "getApproxHint",
    args: [nicr, trials, BigInt(Math.floor(Math.random() * 1_000_000_000))],
  });
  let seed = approx[0];
  if (exclude && seed.toLowerCase() === exclude.toLowerCase()) {
    seed = await client.readContract({ address: ADDR.SortedTroves, abi: abi.SortedTroves, functionName: "getPrev", args: [exclude] });
  }
  const pos = await client.readContract({
    address: ADDR.SortedTroves,
    abi: abi.SortedTroves,
    functionName: "findInsertPosition",
    args: [nicr, seed, seed],
  });
  return { upper: pos[0], lower: pos[1] };
}

async function reads() {
  const chainId = await client.getChainId();
  if (chainId !== CHAIN_ID) {
    throw new Error(`Refusing to continue. RPC returned chain ${chainId}, not Mezo testnet ${CHAIN_ID}.`);
  }
  const block = await client.getBlockNumber();
  const price = await client.readContract({ address: ADDR.PriceFeed, abi: abi.PriceFeed, functionName: "fetchPrice" });
  const oracle = await client.readContract({ address: ADDR.PriceFeed, abi: abi.PriceFeed, functionName: "oracle" });
  const redemptionRate = await client.readContract({ address: ADDR.BorrowerOperations, abi: abi.BorrowerOperations, functionName: "redemptionRate" });
  const borrowingRate = await client.readContract({ address: ADDR.BorrowerOperations, abi: abi.BorrowerOperations, functionName: "borrowingRate" });
  const minDebt = await client.readContract({ address: ADDR.BorrowerOperations, abi: abi.BorrowerOperations, functionName: "minNetDebt" });
  const gas = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "MUSD_GAS_COMPENSATION" });
  const mcr = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "MCR" });
  const tcr = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "getTCR", args: [price] });
  const recovery = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "checkRecoveryMode", args: [price] });
  const head = await redemptionHead(price, mcr);
  let icrCheck = "no trove above MCR";
  if (head) {
    const coll = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "getTroveColl", args: [head.address] });
    const debt = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "getTroveDebt", args: [head.address] });
    const principal = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "getTrovePrincipal", args: [head.address] });
    const cap = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "getTroveMaxBorrowingCapacity", args: [head.address] });
    const entire = await client.readContract({ address: ADDR.TroveManager, abi: abi.TroveManager, functionName: "getEntireDebtAndColl", args: [head.address] });
    const local = debt > 0n ? (coll * price) / debt : 0n;
    const freshCap = (coll * price) / (110n * 10n ** 16n);
    const pending = entire[3] + entire[4] + entire[5];
    icrCheck = [
      `trove ${head.address}`,
      `getCurrentICR ${pct(head.icr)}`,
      `coll*price/debt ${pct(local)}`,
      `match ${local === head.icr ? "yes" : "no"}`,
      `pending rewards ${pending === 0n ? "none" : fmt(pending)}`,
      `principal ${fmt(principal)} debt ${fmt(debt)}`,
      `stored maxBorrow ${fmt(cap, 2)} MUSD`,
      `fresh coll*price/110% ${fmt(freshCap, 2)} MUSD`,
    ].join("\n  ");
  }
  const quoteIn = 10n ** 15n;
  const quoted = await client.readContract({
    address: ADDR.SwapRouter,
    abi: abi.router,
    functionName: "getAmountsOut",
    args: [quoteIn, [{ from: ADDR.BTC, to: ADDR.MUSD, stable: false, factory: ADDR.PoolFactory }]],
  });

  console.log(`Mezo testnet chain ${chainId} block ${block}`);
  console.log(`oracle ${oracle}`);
  console.log(`fetchPrice $${fmt(price, 2)}`);
  console.log(`redemptionRate ${pct(redemptionRate)} (${redemptionRate})`);
  console.log(`borrowingRate ${pct(borrowingRate)} minDebt ${fmt(minDebt, 0)} gasReserve ${fmt(gas, 0)}`);
  console.log(`MCR ${pct(mcr)} TCR ${pct(tcr)} recovery ${recovery}`);
  console.log(`redemption head\n  ${icrCheck}`);
  console.log(`pool quote ${fmt(quoteIn, 6)} BTC -> ${fmt(quoted[1], 4)} MUSD`);
  return { price, borrowingRate, minDebt, gas, mcr, recovery, block };
}

function parseKey() {
  const raw = process.env.KUDI_PROOF_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const hex = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("KUDI_PROOF_PRIVATE_KEY must be a 32-byte hex private key.");
  }
  return hex;
}

async function broadcast(snapshot) {
  const key = parseKey();
  if (!key || process.env.KUDI_PROOF_SEND !== "1") {
    printBlocker(key ? "KUDI_PROOF_PRIVATE_KEY is set, but KUDI_PROOF_SEND is not 1, so nothing was broadcast." : "");
    return;
  }
  const chainId = await client.getChainId();
  if (chainId !== CHAIN_ID) throw new Error(`Refusing to broadcast on chain ${chainId}.`);
  const account = privateKeyToAccount(key);
  const wallet = createWalletClient({ account, chain: mezoTestnet, transport: http(RPC) });
  console.log(`signer ${account.address} (key not printed)`);

  const balance = await client.getBalance({ address: account.address });
  const status = await client.readContract({
    address: ADDR.TroveManager,
    abi: abi.TroveManager,
    functionName: "getTroveStatus",
    args: [account.address],
  });
  if (Number(status) === 1) {
    console.log("This wallet already has an open loan. Close it before a fresh open → top-up → repay run, or use a new faucet wallet.");
    return;
  }
  const fee = snapshot.recovery ? 0n : await client.readContract({
    address: ADDR.BorrowerOperations,
    abi: abi.BorrowerOperations,
    functionName: "getBorrowingFee",
    args: [snapshot.minDebt],
  });
  const composite = snapshot.minDebt + fee + snapshot.gas;
  const coll = (composite * 200n * 10n ** 16n) / snapshot.price;
  const topUp = 10n ** 14n;
  const swapIn = 10n ** 14n;
  const reserve = 10n ** 14n;
  const need = coll + topUp + swapIn + reserve;
  console.log(`open needs ${fmt(coll, 6)} BTC collateral. Wallet has ${fmt(balance, 6)} BTC. Target about ${fmt(need, 6)} BTC including top-up, swap, and a fee reserve.`);
  if (balance < need) {
    printBlocker(`The signer is short of test BTC (have ${fmt(balance, 6)}, need about ${fmt(need, 6)}).`);
    return;
  }

  async function send(label, request) {
    const hash = await wallet.writeContract(request);
    console.log(`${label} ${txLink(hash)}`);
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") throw new Error(`${label} reverted: ${hash}`);
    return hash;
  }

  const openHints = await hints(coll, composite, account.address);
  await send("openTrove", {
    address: ADDR.BorrowerOperations,
    abi: abi.BorrowerOperations,
    functionName: "openTrove",
    args: [snapshot.minDebt, openHints.upper, openHints.lower],
    value: coll,
  });

  const principal = await client.readContract({
    address: ADDR.TroveManager,
    abi: abi.TroveManager,
    functionName: "getTrovePrincipal",
    args: [account.address],
  });
  const topped = coll + topUp;
  const addHints = await hints(topped, principal, account.address);
  await send("addColl", {
    address: ADDR.BorrowerOperations,
    abi: abi.BorrowerOperations,
    functionName: "addColl",
    args: [addHints.upper, addHints.lower],
    value: topUp,
  });

  const repay = 10n ** 18n;
  const debt = await client.readContract({
    address: ADDR.TroveManager,
    abi: abi.TroveManager,
    functionName: "getTroveDebt",
    args: [account.address],
  });
  const interest = debt > principal ? debt - principal : 0n;
  const nextPrincipal = repay > interest ? principal - (repay - interest) : principal;
  const repayHints = await hints(topped, nextPrincipal, account.address);
  const allowance = await client.readContract({
    address: ADDR.MUSD,
    abi: erc20,
    functionName: "allowance",
    args: [account.address, ADDR.BorrowerOperations],
  });
  if (allowance < repay) {
    await send("approve MUSD", {
      address: ADDR.MUSD,
      abi: erc20,
      functionName: "approve",
      args: [ADDR.BorrowerOperations, repay],
    });
  }
  await send("repayMUSD", {
    address: ADDR.BorrowerOperations,
    abi: abi.BorrowerOperations,
    functionName: "repayMUSD",
    args: [repay, repayHints.upper, repayHints.lower],
  });

  const route = [{ from: ADDR.BTC, to: ADDR.MUSD, stable: false, factory: ADDR.PoolFactory }];
  const quoted = await client.readContract({
    address: ADDR.SwapRouter,
    abi: abi.router,
    functionName: "getAmountsOut",
    args: [swapIn, route],
  });
  const btcAllowance = await client.readContract({
    address: ADDR.BTC,
    abi: erc20,
    functionName: "allowance",
    args: [account.address, ADDR.SwapRouter],
  });
  if (btcAllowance < swapIn) {
    await send("approve BTC", {
      address: ADDR.BTC,
      abi: erc20,
      functionName: "approve",
      args: [ADDR.SwapRouter, swapIn],
    });
  }
  const minOut = (quoted[1] * 995n) / 1000n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
  await send("swapExactTokensForTokens", {
    address: ADDR.SwapRouter,
    abi: abi.router,
    functionName: "swapExactTokensForTokens",
    args: [swapIn, minOut, route, account.address, deadline],
  });
  console.log("Level-3 sequence confirmed on Mezo testnet.");
}

const snapshot = await reads();
await broadcast(snapshot);

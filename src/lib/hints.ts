import type { Address, PublicClient } from "viem";
import { hintHelpersAbi, sortedTrovesAbi } from "./abi";
import { CONTRACTS } from "./mezo";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Sorted-trove insert hints.
 * `nominalDebt` must be the debt the contract uses for nominal CR:
 * composite debt (borrow + fee + gas reserve) when opening, principal
 * (not principal + interest) when topping up, borrowing more, or repaying.
 * Trial count follows the Mezo guide: 15 * sqrt(list size). A flat 15
 * trials on a few hundred troves leaves a hint far from the insert point,
 * and the contract then walks the list until it runs out of gas.
 */
export async function findTroveHints(
  client: PublicClient,
  coll: bigint,
  nominalDebt: bigint,
  exclude?: Address,
): Promise<{ upper: Address; lower: Address }> {
  if (coll <= 0n || nominalDebt <= 0n) return { upper: ZERO, lower: ZERO };
  const nicr = (coll * 10n ** 20n) / nominalDebt;
  const size = await client.readContract({
    address: CONTRACTS.SortedTroves,
    abi: sortedTrovesAbi,
    functionName: "getSize",
  });
  const trials = BigInt(Math.max(15, Math.ceil(Math.sqrt(Number(size))) * 15));
  const approx = await client.readContract({
    address: CONTRACTS.HintHelpers,
    abi: hintHelpersAbi,
    functionName: "getApproxHint",
    args: [nicr, trials, BigInt(Math.floor(Math.random() * 1_000_000_000))],
  });
  let seed = approx[0];
  if (exclude && same(seed, exclude)) {
    const prev = await client.readContract({
      address: CONTRACTS.SortedTroves,
      abi: sortedTrovesAbi,
      functionName: "getPrev",
      args: [exclude],
    });
    seed = prev;
  }
  const pos = await client.readContract({
    address: CONTRACTS.SortedTroves,
    abi: sortedTrovesAbi,
    functionName: "findInsertPosition",
    args: [nicr, seed, seed],
  });
  return {
    upper: await neighbor(client, pos[0], exclude, "getPrev"),
    lower: await neighbor(client, pos[1], exclude, "getNext"),
  };
}

function same(a: Address, b: Address): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Drop the borrower's own node. reInsert removes it before using the hint. */
async function neighbor(
  client: PublicClient,
  id: Address,
  exclude: Address | undefined,
  toward: "getPrev" | "getNext",
): Promise<Address> {
  if (!exclude || !same(id, exclude)) return id;
  return client.readContract({
    address: CONTRACTS.SortedTroves,
    abi: sortedTrovesAbi,
    functionName: toward,
    args: [exclude],
  });
}

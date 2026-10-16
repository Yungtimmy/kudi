import type { Address, PublicClient } from "viem";
import { hintHelpersAbi, sortedTrovesAbi } from "./abi";
import { CONTRACTS } from "./mezo";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Sorted-trove insert hints, as in the Mezo MUSD integration guide.
 * Nominal CR uses coll * 1e20 / debt (not BigInt(1e20), which is not exact).
 */
export async function findTroveHints(
  client: PublicClient,
  coll: bigint,
  totalDebt: bigint,
): Promise<{ upper: Address; lower: Address }> {
  if (coll <= 0n || totalDebt <= 0n) return { upper: ZERO, lower: ZERO };
  const nicr = (coll * 10n ** 20n) / totalDebt;
  const approx = await client.readContract({
    address: CONTRACTS.HintHelpers,
    abi: hintHelpersAbi,
    functionName: "getApproxHint",
    args: [nicr, 15n, BigInt(Math.floor(Math.random() * 1_000_000_000))],
  });
  const pos = await client.readContract({
    address: CONTRACTS.SortedTroves,
    abi: sortedTrovesAbi,
    functionName: "findInsertPosition",
    args: [nicr, approx[0], approx[0]],
  });
  return { upper: pos[0], lower: pos[1] };
}

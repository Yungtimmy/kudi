"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAbiItem, type Address } from "viem";
import { usePublicClient } from "wagmi";
import { CONTRACTS, MEZO_TESTNET } from "@/lib/mezo";

const transfer = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

export type ActivityRow = {
  id: string;
  direction: "in" | "out";
  value: bigint;
  counterparty: string;
  when?: number;
  hash: string;
};

type Draft = ActivityRow & { block: bigint };

export function useActivity(address?: Address) {
  const client = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  return useQuery({
    queryKey: ["kudi", "activity", address],
    enabled: Boolean(client && address),
    staleTime: 30_000,
    queryFn: async (): Promise<ActivityRow[]> => {
      if (!client || !address) return [];
      const latest = await client.getBlockNumber();
      const fromBlock = latest > 9000n ? latest - 9000n : 0n;
      const [incoming, outgoing] = await Promise.all([
        client.getLogs({
          address: CONTRACTS.MUSD,
          event: transfer,
          args: { to: address },
          fromBlock,
          toBlock: latest,
        }),
        client.getLogs({
          address: CONTRACTS.MUSD,
          event: transfer,
          args: { from: address },
          fromBlock,
          toBlock: latest,
        }),
      ]);
      const merged = new Map<string, Draft>();
      for (const log of incoming) {
        const id = `${log.transactionHash}-${log.logIndex ?? 0}`;
        merged.set(id, {
          id,
          direction: "in",
          value: log.args.value ?? 0n,
          counterparty: log.args.from ?? "",
          hash: log.transactionHash ?? "",
          block: log.blockNumber ?? 0n,
        });
      }
      for (const log of outgoing) {
        const id = `${log.transactionHash}-${log.logIndex ?? 0}`;
        if (merged.has(id)) continue;
        merged.set(id, {
          id,
          direction: "out",
          value: log.args.value ?? 0n,
          counterparty: log.args.to ?? "",
          hash: log.transactionHash ?? "",
          block: log.blockNumber ?? 0n,
        });
      }
      const top = [...merged.values()]
        .sort((a, b) => (a.block === b.block ? 0 : a.block > b.block ? -1 : 1))
        .slice(0, 6);
      const blocks = [...new Set(top.map((row) => row.block.toString()))];
      const times = await Promise.all(
        blocks.map(async (block) => {
          const full = await client.getBlock({ blockNumber: BigInt(block) });
          return [block, Number(full.timestamp)] as const;
        }),
      );
      const timeByBlock = new Map(times);
      return top.map(({ block, ...row }) => ({ ...row, when: timeByBlock.get(block.toString()) }));
    },
  });
}

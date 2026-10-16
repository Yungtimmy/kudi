"use client";

import { useAccount, useBalance, useReadContract, useReadContracts } from "wagmi";
import { borrowerOpsAbi, erc20Abi, interestRateAbi, troveManagerAbi, priceFeedAbi } from "@/lib/abi";
import { CONTRACTS, MEZO_TESTNET } from "@/lib/mezo";
import { ACTIVE_TROVE, wadToPct } from "@/lib/loan";

const chainId = MEZO_TESTNET.chainId;

export function useProtocol() {
  const price = useReadContract({
    address: CONTRACTS.PriceFeed,
    abi: priceFeedAbi,
    functionName: "fetchPrice",
    chainId,
    query: { refetchInterval: 30_000 },
  });

  const params = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "MCR", chainId },
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "CCR", chainId },
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "MUSD_GAS_COMPENSATION", chainId },
      { address: CONTRACTS.BorrowerOperations, abi: borrowerOpsAbi, functionName: "minNetDebt", chainId },
      { address: CONTRACTS.BorrowerOperations, abi: borrowerOpsAbi, functionName: "borrowingRate", chainId },
      { address: CONTRACTS.InterestRateManager, abi: interestRateAbi, functionName: "interestRate", chainId },
    ],
    query: { staleTime: 60_000 },
  });

  const p = price.data;
  const tcr = useReadContract({
    address: CONTRACTS.TroveManager,
    abi: troveManagerAbi,
    functionName: "getTCR",
    args: [p ?? 0n],
    chainId,
    query: { enabled: p != null, refetchInterval: 30_000 },
  });
  const recoveryCall = useReadContract({
    address: CONTRACTS.TroveManager,
    abi: troveManagerAbi,
    functionName: "checkRecoveryMode",
    args: [p ?? 0n],
    chainId,
    query: { enabled: p != null, refetchInterval: 30_000 },
  });

  const read = <T,>(index: number): T | undefined => {
    const row = params.data?.[index];
    if (!row || row.status !== "success") return undefined;
    return row.result as T;
  };

  const mcr = read<bigint>(0);
  const ccr = read<bigint>(1);
  const interestRaw = read<number | bigint>(5);
  const tcrWad = tcr.data;
  const tcrPct = tcrWad == null ? undefined : wadToPct(tcrWad);
  const ccrPct = ccr == null ? undefined : wadToPct(ccr);
  const recovery =
    recoveryCall.data === true || (tcrPct != null && ccrPct != null && tcrPct < ccrPct);

  return {
    price: p,
    priceLoading: price.isPending,
    priceError: price.isError,
    mcr,
    ccr,
    gas: read<bigint>(2),
    minDebt: read<bigint>(3),
    borrowRate: read<bigint>(4),
    interestPct: interestRaw == null ? undefined : Number(interestRaw) / 100,
    mcrPct: mcr == null ? undefined : wadToPct(mcr),
    ccrPct,
    tcrPct,
    recovery,
  };
}

export function usePosition() {
  const { address, isConnected } = useAccount();
  const protocol = useProtocol();
  const price = protocol.price;

  const btc = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address), refetchInterval: 20_000 },
  });
  const musd = useReadContract({
    address: CONTRACTS.MUSD,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: Boolean(address), refetchInterval: 20_000 },
  });
  const trove = useReadContracts({
    allowFailure: true,
    contracts: address
      ? [
          { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTroveStatus", args: [address], chainId },
          { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTroveColl", args: [address], chainId },
          { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTroveDebt", args: [address], chainId },
          {
            address: CONTRACTS.TroveManager,
            abi: troveManagerAbi,
            functionName: "getCurrentICR",
            args: [address, price ?? 0n],
            chainId,
          },
        ]
      : [],
    query: { enabled: Boolean(address && price), refetchInterval: 20_000 },
  });

  const cell = <T,>(index: number): T | undefined => {
    const row = trove.data?.[index];
    if (!row || row.status !== "success") return undefined;
    return row.result as T;
  };

  const status = cell<number>(0);
  const active = status === ACTIVE_TROVE;
  const coll = active ? cell<bigint>(1) : undefined;
  const debt = active ? cell<bigint>(2) : undefined;
  const icr = active ? cell<bigint>(3) : undefined;

  return {
    address,
    isConnected,
    protocol,
    btc: btc.data?.value,
    musd: musd.data,
    coll,
    debt,
    ratioPct: icr == null ? undefined : wadToPct(icr),
    loading: Boolean(address) && (btc.isPending || musd.isPending || (price != null && trove.isPending)),
    refetch() {
      void btc.refetch();
      void musd.refetch();
      void trove.refetch();
    },
  };
}

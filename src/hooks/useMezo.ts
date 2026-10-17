"use client";

import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import { useAccount, useReadContracts } from "wagmi";
import { borrowerOpsAbi, erc20Abi, interestRateAbi, troveManagerAbi, priceFeedAbi } from "@/lib/abi";
import { ACTIVE_TROVE, previewRatioPct, wadToPct } from "@/lib/loan";
import { CONTRACTS, MEZO_TESTNET } from "@/lib/mezo";
import {
  readCachedMcr,
  readCachedPosition,
  readCachedPrice,
  writeCachedMcr,
  writeCachedPosition,
  writeCachedPrice,
  type PositionCache,
} from "@/lib/readCache";
import { savedWalletAddress } from "@/lib/restoreWallet";

const chainId = MEZO_TESTNET.chainId;

// One attempt. The transport itself gives up at 8s, so a stuck call cannot
// stack into the old 10s × 3 retry and hold the cards for half a minute.
const fastRead = { retry: false as const, staleTime: 10_000 };

function useReadAddress(watch?: Address): Address | undefined {
  const account = useAccount();
  const [saved] = useState<Address | undefined>(() => savedWalletAddress());
  const sawConnected = useRef(false);
  const [released, setReleased] = useState(false);
  useEffect(() => {
    if (account.status === "connected" && account.address) sawConnected.current = true;
    if (sawConnected.current && account.status === "disconnected") setReleased(true);
  }, [account.address, account.status]);
  if (watch) return watch;
  if (account.address) return account.address;
  if (released) return undefined;
  return saved;
}

export function useProtocol() {
  const [seededPrice] = useState(() => readCachedPrice());
  const [seededMcr] = useState(() => readCachedMcr());

  const bundle = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: CONTRACTS.PriceFeed, abi: priceFeedAbi, functionName: "fetchPrice", chainId },
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "MCR", chainId },
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "CCR", chainId },
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "MUSD_GAS_COMPENSATION", chainId },
      { address: CONTRACTS.BorrowerOperations, abi: borrowerOpsAbi, functionName: "minNetDebt", chainId },
      { address: CONTRACTS.BorrowerOperations, abi: borrowerOpsAbi, functionName: "borrowingRate", chainId },
      { address: CONTRACTS.InterestRateManager, abi: interestRateAbi, functionName: "interestRate", chainId },
    ],
    query: { ...fastRead, refetchInterval: 30_000 },
  });

  const read = <T,>(index: number): T | undefined => {
    const row = bundle.data?.[index];
    if (!row || row.status !== "success") return undefined;
    return row.result as T;
  };

  const freshPrice = read<bigint>(0);
  const price = freshPrice ?? seededPrice;
  const freshMcr = read<bigint>(1);
  const mcr = freshMcr ?? seededMcr;
  // Cached price lets the ratio and recovery calls leave with the first paint
  // instead of waiting for fetchPrice to return.
  const quote = freshPrice ?? seededPrice;

  const system = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTCR", args: [quote ?? 0n], chainId },
      { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "checkRecoveryMode", args: [quote ?? 0n], chainId },
    ],
    query: {
      ...fastRead,
      enabled: quote != null,
      refetchInterval: 30_000,
    },
  });

  useEffect(() => {
    if (freshPrice != null) writeCachedPrice(freshPrice);
  }, [freshPrice]);
  useEffect(() => {
    if (freshMcr != null) writeCachedMcr(freshMcr);
  }, [freshMcr]);

  const systemCell = <T,>(index: number): T | undefined => {
    const row = system.data?.[index];
    if (!row || row.status !== "success") return undefined;
    return row.result as T;
  };

  const ccr = read<bigint>(2);
  const interestRaw = read<number | bigint>(6);
  const tcrWad = systemCell<bigint>(0);
  const recoveryFlag = systemCell<boolean>(1);
  const tcrPct = tcrWad == null ? undefined : wadToPct(tcrWad);
  const ccrPct = ccr == null ? undefined : wadToPct(ccr);
  const recovery = recoveryFlag === true || (tcrPct != null && ccrPct != null && tcrPct < ccrPct);

  return {
    price,
    priceLoading: bundle.isPending && price == null,
    priceError: bundle.isError && price == null,
    mcr,
    ccr,
    gas: read<bigint>(3),
    minDebt: read<bigint>(4),
    borrowRate: read<bigint>(5),
    interestPct: interestRaw == null ? undefined : Number(interestRaw) / 100,
    mcrPct: mcr == null ? undefined : wadToPct(mcr),
    ccrPct,
    tcrPct,
    recovery,
  };
}

/** Balances and trove for `watch`, or for the connected wallet when `watch` is omitted. */
export function usePosition(watch?: Address) {
  const account = useAccount();
  const address = useReadAddress(watch);
  const protocol = useProtocol();
  const price = protocol.price;
  const [cached] = useState<PositionCache | null>(() => {
    const initial = watch ?? savedWalletAddress();
    return initial ? readCachedPosition(initial) : null;
  });
  const remembered = cached && address && cached.address.toLowerCase() === address.toLowerCase() ? cached : null;

  const position = useReadContracts({
    allowFailure: true,
    contracts: address
      ? [
          { address: CONTRACTS.BTC, abi: erc20Abi, functionName: "balanceOf", args: [address], chainId },
          { address: CONTRACTS.MUSD, abi: erc20Abi, functionName: "balanceOf", args: [address], chainId },
          { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTroveStatus", args: [address], chainId },
          { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTroveColl", args: [address], chainId },
          { address: CONTRACTS.TroveManager, abi: troveManagerAbi, functionName: "getTroveDebt", args: [address], chainId },
        ]
      : [],
    query: {
      ...fastRead,
      enabled: Boolean(address),
      refetchInterval: (query) => {
        const row = query.state.data?.[0];
        return row?.status === "success" && row.result === 0n ? 8_000 : 20_000;
      },
    },
  });

  const cell = <T,>(index: number): T | undefined => {
    const row = position.data?.[index];
    if (!row || row.status !== "success") return undefined;
    return row.result as T;
  };

  const btcLive = cell<bigint>(0);
  const musdLive = cell<bigint>(1);
  const status = cell<number | bigint>(2);
  const collLive = cell<bigint>(3);
  const debtLive = cell<bigint>(4);
  const liveKnown = position.isSuccess && status != null;
  const active = status != null && Number(status) === ACTIVE_TROVE;

  useEffect(() => {
    if (!address || !liveKnown || btcLive == null || musdLive == null) return;
    writeCachedPosition({
      address,
      btc: btcLive,
      musd: musdLive,
      active,
      coll: active ? collLive : undefined,
      debt: active ? debtLive : undefined,
    });
  }, [address, liveKnown, btcLive, musdLive, active, collLive, debtLive]);

  const loanState: "unknown" | "active" | "none" = liveKnown
    ? active
      ? "active"
      : "none"
    : remembered
      ? remembered.active
        ? "active"
        : "none"
      : "unknown";
  const coll = liveKnown ? (active ? collLive : undefined) : remembered?.active ? remembered.coll : undefined;
  const debt = liveKnown ? (active ? debtLive : undefined) : remembered?.active ? remembered.debt : undefined;
  const btc = btcLive ?? remembered?.btc;
  const musd = musdLive ?? remembered?.musd;
  const ratioPct = coll != null && debt != null && price != null ? previewRatioPct(coll, price, debt) ?? undefined : undefined;

  return {
    address,
    isConnected: account.isConnected,
    watching: watch != null,
    protocol,
    btc,
    musd,
    coll,
    debt,
    /** Collateral ratio from coll, debt, and price. Debt includes the gas reserve. */
    ratioPct,
    loanState,
    readsSettled: !address || position.isFetched || position.isError,
    loading: Boolean(address) && loanState === "unknown" && btc == null && musd == null && !position.isError,
    refetch() {
      void position.refetch();
    },
  };
}

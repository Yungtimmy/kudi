"use client";

import { useState } from "react";
import { useAccount, useConfig, usePublicClient, useReadContract, useSwitchChain } from "wagmi";
import { useI18n } from "@/i18n/I18nProvider";
import { borrowerOpsAbi, erc20Abi } from "@/lib/abi";
import { formatBtc, formatMusd, parseAmount, txMessage } from "@/lib/format";
import { findTroveHints } from "@/lib/hints";
import { SAFE_ICR_PCT, collateralForRatio, previewRatioPct } from "@/lib/loan";
import { ensureBitcoinAccount, WalletNotConnectedError } from "@/lib/bitcoinWallet";
import { sendContractWrite } from "@/lib/walletWrite";
import { CONTRACTS, MEZO_TESTNET, txUrl } from "@/lib/mezo";

type Props = {
  coll: bigint;
  debt: bigint;
  price: bigint;
  gas: bigint;
  minDebt: bigint;
  btc?: bigint;
  musd?: bigint;
  onDone: () => void;
};

export function LoanCare(props: Props) {
  const { t } = useI18n();
  const { address, chainId, connector } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { switchChainAsync } = useSwitchChain();
  const [mode, setMode] = useState<"add" | "repay" | null>(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain" | "done">("idle");
  const [error, setError] = useState("");
  const [tx, setTx] = useState("");

  const amount = parseAmount(text);
  const allowance = useReadContract({
    address: CONTRACTS.MUSD,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.BorrowerOperations] : undefined,
    chainId: MEZO_TESTNET.chainId,
    query: { enabled: mode === "repay" && Boolean(address) },
  });
  const maxRepay = props.debt > props.gas + props.minDebt ? props.debt - props.gas - props.minDebt : 0n;
  const needsApproval = mode === "repay" && amount != null && amount > 0n && (allowance.data ?? 0n) < amount;
  const nextColl = mode === "add" && amount != null && amount > 0n ? props.coll + amount : props.coll;
  const nextDebt = mode === "repay" && amount != null && amount > 0n && amount <= props.debt ? props.debt - amount : props.debt;
  const nextRatio = props.price > 0n ? previewRatioPct(nextColl, props.price, nextDebt) : null;
  const busy = phase === "wallet" || phase === "chain";

  let block = "";
  if (mode === "add") {
    if (amount == null || amount <= 0n) block = t("borrow.needBtc");
    else if (props.btc != null && amount > props.btc) block = t("home.addShort", { have: formatBtc(props.btc) });
  } else if (mode === "repay") {
    if (amount == null || amount <= 0n) block = t("home.repayNeed");
    else if (amount > maxRepay) block = t("home.repayMax", { amount: formatMusd(maxRepay, maxRepay === 0n ? 0 : 2) });
    else if (props.musd != null && amount > props.musd) block = t("send.funds");
  }

  function open(next: "add" | "repay") {
    setMode(next);
    setError("");
    setPhase("idle");
    setTx("");
    if (next === "add") {
      const target = props.price > 0n ? collateralForRatio(props.debt, props.price, SAFE_ICR_PCT) : null;
      const gap = target != null && target > props.coll ? target - props.coll : 0n;
      const wallet = props.btc ?? 0n;
      const suggested = gap > 0n && wallet > 0n && gap > wallet ? wallet : gap;
      setText(suggested > 0n ? formatBtc(suggested).replace(/,/g, "") : "");
    } else {
      const bal = props.musd ?? 0n;
      const suggested = maxRepay > 0n && bal > 0n ? (maxRepay < bal ? maxRepay : bal) : 0n;
      setText(suggested > 0n ? formatMusd(suggested).replace(/,/g, "") : "");
    }
  }

  async function submit() {
    if (!publicClient || amount == null || amount <= 0n || block || !mode) return;
    setError("");
    setPhase("wallet");
    try {
      if (!address) throw new WalletNotConnectedError();
      await ensureBitcoinAccount(connector);
      if (chainId !== MEZO_TESTNET.chainId) await switchChainAsync({ chainId: MEZO_TESTNET.chainId });
      if (mode === "repay" && needsApproval) {
        const approveHash = await sendContractWrite(config, connector, address, {
          address: CONTRACTS.MUSD,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACTS.BorrowerOperations, amount],
        });
        setPhase("chain");
        const approved = await publicClient.waitForTransactionReceipt({ hash: approveHash });
        if (approved.status !== "success") throw new Error(t("receipt.failed"));
        await allowance.refetch();
        setPhase("idle");
        return;
      }
      const hints = await findTroveHints(publicClient, nextColl, nextDebt);
      const hash = mode === "add"
        ? await sendContractWrite(config, connector, address, {
            address: CONTRACTS.BorrowerOperations,
            abi: borrowerOpsAbi,
            functionName: "addColl",
            args: [hints.upper, hints.lower],
            value: amount,
          })
        : await sendContractWrite(config, connector, address, {
            address: CONTRACTS.BorrowerOperations,
            abi: borrowerOpsAbi,
            functionName: "repayMUSD",
            args: [amount, hints.upper, hints.lower],
          });
      setPhase("chain");
      setTx(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(t("receipt.failed"));
      setPhase("done");
      props.onDone();
    } catch (err) {
      setError(err instanceof WalletNotConnectedError ? t("wallet.connectFirst") : txMessage(err, t("common.closed")));
      setPhase("idle");
    }
  }

  return (
    <div className="loan-care">
      <div className="care-row">
        <button type="button" className="care-btn" onClick={() => open("add")}>{t("borrow.add")}</button>
        <button type="button" className="care-btn outline" onClick={() => open("repay")}>{t("home.repay")}</button>
      </div>
      {mode ? (
        <div className="care-form">
          <p className="caption">{mode === "add" ? t("home.addBtcHint") : t("home.repayHint")}</p>
          <input
            className="bare dark"
            inputMode="decimal"
            aria-label={mode === "add" ? t("borrow.add") : t("home.repay")}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (phase === "done") setPhase("idle");
            }}
          />
          {nextRatio != null && !block ? <p className="caption">{t("guide.ratio")}: {Math.round(nextRatio)}%</p> : null}
          {block ? <p className="note">{block}</p> : null}
          {error ? <p className="error">{error}</p> : null}
          {phase === "done" && tx ? (
            <p className="ok">{t("home.careDone")} <a href={txUrl(tx)}>{t("receipt.explorer")}</a></p>
          ) : null}
          <button className="btn" type="button" disabled={Boolean(block) || busy || phase === "done"} onClick={submit}>
            <span />
            <span>
              {busy ? t("borrow.pending") : mode === "repay" && needsApproval ? t("home.approve") : mode === "add" ? t("borrow.add") : t("home.repay")}
            </span>
            <span />
          </button>
        </div>
      ) : null}
    </div>
  );
}

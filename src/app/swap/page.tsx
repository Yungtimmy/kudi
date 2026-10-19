"use client";

import { useEffect, useState } from "react";
import { PassportConnect } from "@/components/PassportConnect";
import { useAccount, useConfig, usePublicClient, useReadContract, useSwitchChain } from "wagmi";
import { BtcMark, CoinsArt } from "@/components/Illustrations";
import { SideSummary } from "@/components/SideSummary";
import { RateLine } from "@/components/RateLine";
import { useFx } from "@/hooks/useFx";
import { usePosition } from "@/hooks/useMezo";
import { useI18n } from "@/i18n/I18nProvider";
import { erc20Abi, routerAbi } from "@/lib/abi";
import { ensureBitcoinAccount, WalletNotConnectedError } from "@/lib/bitcoinWallet";
import { sendContractWrite } from "@/lib/walletWrite";
import { btcToMusdRoute, musdToBtcRoute, CONTRACTS, MEZO_TESTNET, txUrl } from "@/lib/mezo";
import { BTC_FEE_RESERVE } from "@/lib/loan";
import { formatBtc, formatMusd, formatNaira, musdToNaira, parseAmount, txMessage, WAD } from "@/lib/format";

export default function SwapPage() {
  const { t } = useI18n();
  const fx = useFx();
  const { address, isConnected, btc, musd, refetch } = usePosition();
  const { chainId, connector } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { switchChainAsync } = useSwitchChain();
  const [text, setText] = useState("");
  // false: BTC to MUSD. true: MUSD to BTC. Same router and pool, reversed route.
  const [back, setBack] = useState(false);
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain" | "done">("idle");
  const [error, setError] = useState("");
  const [tx, setTx] = useState("");

  const amount = parseAmount(text);
  const route = back ? musdToBtcRoute() : btcToMusdRoute();
  const payToken = back ? CONTRACTS.MUSD : CONTRACTS.BTC;
  const quote = useReadContract({
    address: CONTRACTS.SwapRouter,
    abi: routerAbi,
    functionName: "getAmountsOut",
    args: amount && amount > 0n ? [amount, route] : undefined,
    chainId: MEZO_TESTNET.chainId,
    query: { enabled: Boolean(amount && amount > 0n) },
  });
  const allowance = useReadContract({
    address: payToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.SwapRouter] : undefined,
    chainId: MEZO_TESTNET.chainId,
    query: { enabled: Boolean(address) },
  });

  const out = quote.data?.[1];
  // Rate is always per 1 unit of what you pay.
  const perBtc = amount && amount > 0n && out != null ? (out * WAD) / amount : null;
  const fmtOut = (v: bigint, dp?: number) => (back ? formatBtc(v) : formatMusd(v, dp));
  const fmtIn = (v: bigint) => (back ? formatMusd(v) : formatBtc(v));
  const payUnit = back ? "MUSD" : "BTC";
  const getUnit = back ? "BTC" : "MUSD";
  const rateText = perBtc != null ? (back ? t("swap.rateBack", { amount: formatBtc(perBtc) }) : t("swap.rate", { amount: formatMusd(perBtc, 0) })) : null;
  const musdSide = back ? amount : out;
  const naira = !fx.loading && musdSide != null && musdSide > 0n ? formatNaira(musdToNaira(musdSide, fx.ngnPerUsd)) : null;
  const needsApproval = amount != null && amount > 0n && (allowance.data ?? 0n) < amount;
  const busy = phase === "wallet" || phase === "chain";

  let block = "";
  const need = back ? t("swap.needMusd") : t("swap.need");
  if (amount == null) block = need;
  else if (amount <= 0n) block = need;
  else if (quote.isError) block = t("swap.noQuote");
  else if (quote.isLoading || out == null) block = t("swap.quoting");
  else if (!back && btc != null && amount > btc) block = t("swap.funds");
  else if (back && musd != null && amount > musd) block = t("swap.fundsMusd");
  else if (back && btc != null && btc < BTC_FEE_RESERVE) block = t("swap.feeBtc");

  async function submit() {
    if (!publicClient || !amount || amount <= 0n || out == null || block) return;
    setError("");
    setPhase("wallet");
    try {
      if (!address) throw new WalletNotConnectedError();
      await ensureBitcoinAccount(connector);
      if (chainId !== MEZO_TESTNET.chainId) await switchChainAsync({ chainId: MEZO_TESTNET.chainId });
      if (needsApproval) {
        const approveHash = await sendContractWrite(config, connector, address, {
          address: payToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACTS.SwapRouter, amount],
        });
        setPhase("chain");
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        await allowance.refetch();
        setPhase("idle");
        return;
      }
      const minOut = (out * 995n) / 1000n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const hash = await sendContractWrite(config, connector, address, {
        address: CONTRACTS.SwapRouter,
        abi: routerAbi,
        functionName: "swapExactTokensForTokens",
        args: [amount, minOut, route, address, deadline],
      });
      setPhase("chain");
      setTx(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(t("receipt.failed"));
      setPhase("done");
      refetch();
    } catch (err) {
      console.error(err);
      setError(err instanceof WalletNotConnectedError ? t("wallet.connectFirst") : txMessage(err, t("common.closed"), t));
      setPhase("idle");
    }
  }

  return (
    <main className="screen form-page">
      <div className="form-main">
      <div className="swap-art">
        <h1>{back ? t("swap.titleBack") : t("swap.title")}</h1>
        <CoinsArt />
      </div>

      <section className="card">
        <div className="caption">{t("swap.from")}</div>
        <div className="token-row" style={{ marginTop: 8 }}>
          {back ? <span className="bubble-lg" style={{ width: 40, height: 40 }}>M</span> : <BtcMark size={40} />}
          <strong>{payUnit}</strong>
          <input
            className={`bare token-amt ${back ? "green" : "orange"}`}
            style={{ fontSize: 22, width: 140 }}
            inputMode="decimal"
            aria-label={t("swap.from")}
            placeholder="0.00"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        {back
          ? musd != null ? <p className="caption" style={{ marginTop: 8 }}>{t("borrow.wallet")} {formatMusd(musd)} MUSD</p> : null
          : btc != null ? <p className="caption" style={{ marginTop: 8 }}>{t("borrow.wallet")} {formatBtc(btc)} BTC</p> : null}
      </section>
      <button
        type="button"
        className="swap-switch"
        aria-label={t("swap.flip")}
        title={t("swap.flip")}
        disabled={busy}
        onClick={() => {
          setBack((v) => !v);
          setText("");
          setError("");
          setPhase("idle");
          setTx("");
        }}
      >
        ↕
      </button>
      <section className="card">
        <div className="caption">{t("swap.to")}</div>
        <div className="token-row" style={{ marginTop: 8 }}>
          {back ? <BtcMark size={40} /> : <span className="bubble-lg" style={{ width: 40, height: 40 }}>M</span>}
          <strong>{getUnit}</strong>
          <div className={`token-amt ${back ? "orange" : "green"}`}>
            {out != null ? fmtOut(out, 2) : "—"}
            <div className="caption">{naira && !back ? `(~ ${naira})` : ""}</div>
          </div>
        </div>
        <div className="quote-box">
          <div>{rateText ?? t("swap.quoting")}</div>
          <RateLine />
        </div>
      </section>

      <p className="note" style={{ margin: "4px 0 12px" }}>{t("swap.slippage")}</p>
      {block && amount && amount > 0n ? <p className="note" style={{ marginBottom: 8 }}>{block}</p> : null}
      {error ? <p className="error" style={{ marginBottom: 8 }}>{error}</p> : null}
      {phase === "done" && tx ? (
        <p className="ok" style={{ marginBottom: 8 }}>{t("swap.done")} <a href={txUrl(tx)}>{t("receipt.explorer")}</a></p>
      ) : null}

      {isConnected ? (
        <button className="btn" type="button" disabled={Boolean(block) || busy || amount == null} onClick={submit}>
          <span />
          <span>{busy ? t("swap.pending") : needsApproval ? (back ? t("swap.approveMusd") : t("swap.approve")) : back ? t("swap.actionBack") : t("swap.action")}</span>
          <span />
        </button>
      ) : (
        <PassportConnect />
      )}
      </div>
      <SideSummary
        title={t("layout.summary")}
        rows={[
          { label: t("swap.from"), value: amount && amount > 0n ? `${fmtIn(amount)} ${payUnit}${back && naira ? ` · ${naira}` : ""}` : "—" },
          { label: t("swap.to"), value: out != null ? `${fmtOut(out)} ${getUnit}${!back && naira ? ` · ${naira}` : ""}` : "—" },
          { label: t("swap.rateLabel"), value: rateText ?? "—" },
        ]}
      />
    </main>
  );
}

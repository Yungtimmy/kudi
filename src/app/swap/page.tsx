"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
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
import { btcToMusdRoute, CONTRACTS, MEZO_TESTNET, txUrl } from "@/lib/mezo";
import { formatBtc, formatMusd, formatNaira, musdToNaira, parseAmount, txMessage, WAD } from "@/lib/format";

const QUOTE_JUST_NOW_SECONDS = 10;

function useQuoteAge(updatedAt: number) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!updatedAt) return "";
  const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
  return seconds < QUOTE_JUST_NOW_SECONDS ? t("swap.quotedNow") : t("swap.quotedAgo", { seconds });
}

export default function SwapPage() {
  const { t } = useI18n();
  const fx = useFx();
  const { address, isConnected, btc, refetch } = usePosition();
  const { chainId, connector } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { switchChainAsync } = useSwitchChain();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain" | "done">("idle");
  const [error, setError] = useState("");
  const [tx, setTx] = useState("");

  const amount = parseAmount(text);
  const route = btcToMusdRoute();
  const quote = useReadContract({
    address: CONTRACTS.SwapRouter,
    abi: routerAbi,
    functionName: "getAmountsOut",
    args: amount && amount > 0n ? [amount, route] : undefined,
    chainId: MEZO_TESTNET.chainId,
    query: { enabled: Boolean(amount && amount > 0n) },
  });
  const allowance = useReadContract({
    address: CONTRACTS.BTC,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.SwapRouter] : undefined,
    chainId: MEZO_TESTNET.chainId,
    query: { enabled: Boolean(address) },
  });

  const out = quote.data?.[1];
  const quoteAge = useQuoteAge(out != null ? quote.dataUpdatedAt : 0);
  const perBtc = amount && amount > 0n && out != null ? (out * WAD) / amount : null;
  const naira = !fx.loading && out != null ? formatNaira(musdToNaira(out, fx.ngnPerUsd)) : null;
  const needsApproval = amount != null && amount > 0n && (allowance.data ?? 0n) < amount;
  const busy = phase === "wallet" || phase === "chain";

  let block = "";
  if (amount == null) block = t("swap.need");
  else if (amount <= 0n) block = t("swap.need");
  else if (quote.isError) block = t("swap.noQuote");
  else if (quote.isLoading || out == null) block = t("swap.quoting");
  else if (btc != null && amount > btc) block = t("swap.funds");

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
          address: CONTRACTS.BTC,
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
      setError(err instanceof WalletNotConnectedError ? t("wallet.connectFirst") : txMessage(err, t("common.closed")));
      setPhase("idle");
    }
  }

  return (
    <main className="screen form-page">
      <div className="form-main">
      <div className="swap-art">
        <h1>{t("swap.title")}</h1>
        <CoinsArt />
      </div>

      <section className="card">
        <div className="caption">{t("swap.from")}</div>
        <div className="token-row" style={{ marginTop: 8 }}>
          <BtcMark size={40} />
          <strong>BTC</strong>
          <input
            className="bare token-amt orange"
            style={{ fontSize: 22, width: 140 }}
            inputMode="decimal"
            aria-label={t("swap.from")}
            placeholder="0.00"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        {btc != null ? <p className="caption" style={{ marginTop: 8 }}>{t("borrow.wallet")} {formatBtc(btc)} BTC</p> : null}
      </section>
      <div className="swap-switch" aria-hidden="true">↕</div>
      <section className="card">
        <div className="caption">{t("swap.to")}</div>
        <div className="token-row" style={{ marginTop: 8 }}>
          <span className="bubble-lg" style={{ width: 40, height: 40 }}>M</span>
          <strong>MUSD</strong>
          <div className="token-amt green">
            {out != null ? formatMusd(out, 2) : "—"}
            <div className="caption">{naira ? `(~ ${naira})` : ""}</div>
          </div>
        </div>
        <div className="quote-box">
          <div>{perBtc != null ? t("swap.rate", { amount: formatMusd(perBtc, 0) }) : t("swap.quoting")}</div>
          {quoteAge ? <div className="quote-fresh">{quoteAge}</div> : null}
          <RateLine stamp="naira" />
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
          <span>{busy ? t("swap.pending") : needsApproval ? t("swap.approve") : t("swap.action")}</span>
          <span />
        </button>
      ) : (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button className="btn" type="button" onClick={openConnectModal}>
              <span />
              <span>{t("landing.connect")}</span>
              <span />
            </button>
          )}
        </ConnectButton.Custom>
      )}
      </div>
      <SideSummary
        title={t("layout.summary")}
        rows={[
          { label: t("swap.from"), value: amount && amount > 0n ? `${formatBtc(amount)} BTC` : "—" },
          { label: t("swap.to"), value: out != null ? `${formatMusd(out)} MUSD${naira ? ` · ${naira}` : ""}` : "—" },
          { label: t("swap.rateLabel"), value: perBtc != null ? `${t("swap.rate", { amount: formatMusd(perBtc, 0) })}${quoteAge ? ` · ${quoteAge}` : ""}` : "—" },
        ]}
      />
    </main>
  );
}

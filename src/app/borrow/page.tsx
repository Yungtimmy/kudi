"use client";

import { useMemo, useState } from "react";
import { PassportConnect } from "@/components/PassportConnect";
import { useAccount, useConfig, usePublicClient, useSwitchChain } from "wagmi";
import { HealthBar } from "@/components/HealthBar";
import { SideSummary } from "@/components/SideSummary";
import { ArrowIcon, BtcMark, PercentIcon, ShieldIcon } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { RecoveryBanner } from "@/components/RecoveryBanner";
import { useFx } from "@/hooks/useFx";
import { usePosition } from "@/hooks/useMezo";
import { useI18n } from "@/i18n/I18nProvider";
import { borrowerOpsAbi } from "@/lib/abi";
import { ensureBitcoinAccount, WalletNotConnectedError } from "@/lib/bitcoinWallet";
import { sendContractWrite } from "@/lib/walletWrite";
import { CONTRACTS, MEZO_TESTNET, txUrl } from "@/lib/mezo";
import {
  formatBtc,
  formatMusd,
  formatNaira,
  formatUsd,
  musdToNaira,
  parseAmount,
  txMessage,
  wadToWhole,
  wholeToWad,
  WAD,
} from "@/lib/format";
import { loanHealth } from "@/lib/health";
import { findTroveHints } from "@/lib/hints";
import { borrowingFee, liquidationPrice, maxDraw, previewDebt, previewRatioPct } from "@/lib/loan";
import { GuidedLoan } from "./guided";

export default function BorrowPage() {
  const { t } = useI18n();
  const pos = usePosition();
  if (pos.isConnected && pos.loading && pos.coll == null) {
    return <main className="screen form-page"><p className="note">{t("common.loading")}</p></main>;
  }
  if (pos.coll == null) return <GuidedLoan />;
  return <AdjustLoan />;
}

function AdjustLoan() {
  const { t } = useI18n();
  const fx = useFx();
  const { address, isConnected, btc, coll, debt, protocol, refetch } = usePosition();
  const { chainId, connector } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { switchChainAsync } = useSwitchChain();

  const [collText, setCollText] = useState("");
  const [touchedColl, setTouchedColl] = useState(false);
  const [musdWhole, setMusdWhole] = useState(1800);
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain" | "done">("idle");
  const [error, setError] = useState("");
  const [tx, setTx] = useState("");

  const shownColl = touchedColl ? collText : coll != null ? formatBtc(coll) : collText;
  const collWei = parseAmount(shownColl);
  const opening = coll == null;
  const currentDebt = debt ?? 0n;
  const currentColl = coll ?? 0n;
  const price = protocol.price ?? 0n;
  const mcr = protocol.mcr ?? 0n;
  const gas = protocol.gas ?? 200n * WAD;
  const rate = protocol.borrowRate ?? 0n;
  const minDebt = protocol.minDebt ?? 1800n * WAD;
  const amount = wholeToWad(musdWhole);

  const drawCap = useMemo(() => {
    if (collWei == null || collWei <= 0n) return 0n;
    return maxDraw({
      coll: collWei,
      price,
      mcr,
      currentDebt: opening ? 0n : currentDebt,
      gas,
      rateWad: rate,
      opening,
    });
  }, [collWei, price, mcr, currentDebt, gas, rate, opening]);

  const minWhole = opening ? Math.max(1, wadToWhole(minDebt)) : 0;
  const maxWhole = Math.max(minWhole, wadToWhole(drawCap));
  const fee = borrowingFee(amount, rate);
  const totalDebt = previewDebt({
    amount,
    rateWad: rate,
    currentDebt: opening ? 0n : currentDebt,
    gas,
    opening,
  });
  const ratio = collWei == null ? null : previewRatioPct(collWei, price, totalDebt);
  const liq = collWei == null ? null : liquidationPrice(totalDebt, collWei, mcr);
  const withdrawing = !opening && collWei != null && collWei < currentColl;
  const collNaira = !fx.loading && collWei != null && collWei > 0n && price > 0n
    ? formatNaira(musdToNaira((collWei * price) / WAD, fx.ngnPerUsd))
    : null;
  const musdNaira = !fx.loading ? formatNaira(musdToNaira(amount, fx.ngnPerUsd)) : null;
  const fill = maxWhole === minWhole ? 0 : ((musdWhole - minWhole) / (maxWhole - minWhole)) * 100;

  let block = "";
  if (!price || !mcr) block = t("common.loading");
  else if (collWei == null) block = t("borrow.needBtc");
  else if (withdrawing) block = t("borrow.withdrawTodo");
  else if (collWei <= 0n) block = t("borrow.needBtc");
  else if (opening && amount < minDebt) block = t("borrow.belowMin", { amount: formatMusd(minDebt, 0) });
  else if (amount > drawCap) block = t("borrow.aboveMax");
  else if (!opening && amount === 0n && collWei === currentColl) block = t("borrow.needBtc");

  async function confirm() {
    if (!publicClient || block || collWei == null) return;
    setError("");
    setPhase("wallet");
    try {
      if (!address) throw new WalletNotConnectedError();
      await ensureBitcoinAccount(connector);
      if (chainId !== MEZO_TESTNET.chainId) await switchChainAsync({ chainId: MEZO_TESTNET.chainId });
      const hints = await findTroveHints(publicClient, collWei, totalDebt);
      const added = opening ? collWei : collWei - currentColl;
      const hash = opening
        ? await sendContractWrite(config, connector, address, {
            address: CONTRACTS.BorrowerOperations,
            abi: borrowerOpsAbi,
            functionName: "openTrove",
            args: [amount, hints.upper, hints.lower],
            value: collWei,
          })
        : await sendContractWrite(config, connector, address, {
            address: CONTRACTS.BorrowerOperations,
            abi: borrowerOpsAbi,
            functionName: "adjustTrove",
            args: [0n, amount, amount > 0n, hints.upper, hints.lower],
            value: added,
          });
      setPhase("chain");
      setTx(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(t("receipt.failed"));
      setPhase("done");
      refetch();
    } catch (err) {
      setError(err instanceof WalletNotConnectedError ? t("wallet.connectFirst") : txMessage(err, t("common.closed")));
      setPhase("idle");
    }
  }

  function addBtc() {
    const wallet = btc ?? 0n;
    const next = opening ? wallet : currentColl + wallet;
    if (next <= 0n) {
      setTouchedColl(true);
      return;
    }
    setCollText(formatBtc(next));
    setTouchedColl(true);
  }

  const busy = phase === "wallet" || phase === "chain";

  const healthLabel = ratio == null ? "—" : t(`health.${loanHealth(ratio)}`);

  return (
    <main className="screen form-page">
      <div className="form-main">
      <h1>{t("borrow.title")}</h1>
      <RecoveryBanner />
      <section className="card">
        <div className="deposit-head">
          <div className="btc-row">
            <BtcMark size={40} />
            <div>
              <strong>{t("borrow.deposit")}</strong>
              <div className="caption">{t("borrow.depositHint")}</div>
            </div>
          </div>
          <button type="button" className="pill-btn" onClick={addBtc}>{t("borrow.add")}</button>
        </div>
        <input
          className="bare"
          inputMode="decimal"
          aria-label={t("borrow.deposit")}
          value={shownColl}
          placeholder="0.000"
          onChange={(event) => {
            setTouchedColl(true);
            setCollText(event.target.value);
          }}
        />
        <div className="caption">{collNaira ? `= ${collNaira}` : btc != null ? `${t("borrow.wallet")} ${formatBtc(btc)} BTC` : ""}</div>
      </section>

      <section className="card">
        <div className="split">
          <span className="label">{t("borrow.amount")}</span>
          <RateLine />
        </div>
        <input
          className="bare"
          inputMode="numeric"
          aria-label={t("borrow.amount")}
          value={String(musdWhole)}
          onChange={(event) => {
            const next = Number(event.target.value.replace(/[^\d]/g, ""));
            if (Number.isFinite(next)) setMusdWhole(next);
          }}
        />
        <div className="naira" style={{ color: "var(--kola-green)" }}>{musdNaira ? `(= ${musdNaira})` : ""} <span className="caption">MUSD</span></div>
        <input
          className="slider"
          type="range"
          min={minWhole}
          max={maxWhole}
          step={1}
          value={Math.min(maxWhole, Math.max(minWhole, musdWhole))}
          aria-label={t("borrow.amount")}
          style={{ background: `linear-gradient(90deg, var(--kola-green) ${fill}%, #e4ddd0 ${fill}%)` }}
          onChange={(event) => setMusdWhole(Number(event.target.value))}
        />
        <div className="range-labels">
          <span>{t("borrow.min", { amount: minWhole.toLocaleString("en-US") })}</span>
          <span>{drawCap > 0n ? t("borrow.max", { amount: maxWhole.toLocaleString("en-US") }) : t("borrow.max", { amount: "—" })}</span>
        </div>
      </section>

      <section className="card">
        <h3>{t("borrow.terms")}</h3>
        <div className="terms" style={{ marginTop: 12 }}>
          <div className="term">
            <span className="bubble"><PercentIcon width={18} height={18} /></span>
            <div>
              <strong>{protocol.interestPct ?? 1}%</strong>
              <span>{t("borrow.fixedLabel")}</span>
            </div>
          </div>
          <div className="term">
            <span className="bubble"><ShieldIcon width={18} height={18} /></span>
            <div>
              <strong>{protocol.mcrPct ? `${Math.round(protocol.mcrPct)}%` : "110%"}</strong>
              <span>{t("borrow.mcrLabel")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <HealthBar ratio={ratio} />
        {liq ? (
          <p className="caption" style={{ marginTop: 8 }}>
            {t("home.liq")}: {formatUsd(liq)}
            {!fx.loading ? ` (= ${formatNaira(musdToNaira(liq, fx.ngnPerUsd))})` : ""}
          </p>
        ) : null}
      </section>

      {amount > 0n ? (
        <p className="note" style={{ marginBottom: 12 }}>
          {t("borrow.receive", { amount: formatMusd(amount, 0), fee: formatMusd(fee, 2) })}
          {opening ? ` ${t("borrow.gas", { gas: formatMusd(gas, 0) })}` : ""}
        </p>
      ) : null}
      {withdrawing ? <p className="todo" style={{ marginBottom: 12 }}>{t("borrow.withdrawTodo")}</p> : null}
      {error ? <p className="error" style={{ marginBottom: 12 }}>{error}</p> : null}
      {phase === "done" && tx ? (
        <p className="ok" style={{ marginBottom: 12 }}>
          {t("borrow.done")} <a href={txUrl(tx)}>{t("receipt.explorer")}</a>
        </p>
      ) : null}
      {block && block !== t("common.loading") && !withdrawing ? <p className="note" style={{ marginBottom: 8 }}>{block}</p> : null}

      {isConnected ? (
        <button className="btn" type="button" disabled={Boolean(block) || busy} onClick={confirm}>
          <span />
          <span>{busy ? (phase === "chain" ? t("borrow.sent") : t("borrow.pending")) : t("borrow.confirm")}</span>
          <span className="end"><ArrowIcon width={18} height={18} /></span>
        </button>
      ) : (
        <PassportConnect end={<span className="end"><ArrowIcon width={18} height={18} /></span>} />
      )}

      <div className="foot">
        <span><ShieldIcon width={14} height={14} /> {t("common.nonCustodial")}</span>
        <span className="mezo">{t("common.mezo")}</span>
      </div>
      </div>
      <SideSummary
        title={t("layout.summary")}
        rows={[
          { label: t("borrow.deposit"), value: shownColl ? `${shownColl} BTC` : "—" },
          { label: t("borrow.amount"), value: `${musdWhole.toLocaleString("en-US")} MUSD${musdNaira ? ` · ${musdNaira}` : ""}` },
          { label: t("borrow.fixedLabel"), value: `${protocol.interestPct ?? 1}%` },
          { label: t("home.ratio"), value: ratio == null ? "—" : `${Math.round(ratio)}% · ${healthLabel}` },
          { label: t("home.liq"), value: liq ? formatUsd(liq) : "—" },
        ]}
      />
    </main>
  );
}

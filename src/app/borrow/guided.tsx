"use client";

import { useState } from "react";
import { PassportConnect } from "@/components/PassportConnect";
import { useAccount, useConfig, usePublicClient, useReadContract, useSwitchChain } from "wagmi";
import { SideSummary } from "@/components/SideSummary";
import { ArrowIcon, BtcMark, ShieldIcon } from "@/components/Illustrations";
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
  nairaToMusd,
  parseAmount,
  txMessage,
  WAD,
} from "@/lib/format";
import { loanHealth } from "@/lib/health";
import { findTroveHints } from "@/lib/hints";
import {
  GUIDE_MAX_ICR_PCT,
  SAFE_ICR_PCT,
  borrowingFee,
  collateralForRatio,
  liquidationPrice,
  previewDebt,
  wadToPct,
} from "@/lib/loan";

const PRESET_MUSD = [1800, 3600, 7200];

function parseNaira(input: string): bigint | null {
  const s = input.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(s)) return null;
  return BigInt(s);
}

function presetNaira(musd: number, ngnPerUsd: number): bigint {
  const step = 50_000;
  return BigInt(Math.ceil((musd * ngnPerUsd) / step) * step);
}

export function GuidedLoan() {
  const { t } = useI18n();
  const fx = useFx();
  const { address, isConnected, btc, protocol, refetch } = usePosition();
  const { chainId, connector } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { switchChainAsync } = useSwitchChain();

  const [unit, setUnit] = useState<"musd" | "ngn">("musd");
  const [text, setText] = useState("1800");
  const [targetPct, setTargetPct] = useState(SAFE_ICR_PCT);
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain" | "done">("idle");
  const [error, setError] = useState("");
  const [tx, setTx] = useState("");

  const price = protocol.price ?? 0n;
  const mcr = protocol.mcr ?? 0n;
  const gas = protocol.gas ?? 200n * WAD;
  const rate = protocol.borrowRate ?? 0n;
  const minDebt = protocol.minDebt ?? 1800n * WAD;
  const floor = Math.ceil(protocol.recovery && protocol.ccrPct ? protocol.ccrPct : protocol.mcrPct ?? 110);
  const pct = Math.min(GUIDE_MAX_ICR_PCT, Math.max(floor, targetPct));
  const musdWad = unit === "musd"
    ? parseAmount(text)
    : !fx.loading && text.trim() ? nairaToMusd(parseNaira(text) ?? 0n, fx.ngnPerUsd) : null;
  const feeRead = useReadContract({
    address: CONTRACTS.BorrowerOperations,
    abi: borrowerOpsAbi,
    functionName: "getBorrowingFee",
    args: musdWad != null && musdWad > 0n ? [musdWad] : undefined,
    chainId: MEZO_TESTNET.chainId,
    query: { enabled: musdWad != null && musdWad >= minDebt },
  });
  const fee = feeRead.data ?? (musdWad != null && rate > 0n ? borrowingFee(musdWad, rate) : 0n);
  const feeReady = feeRead.data != null;
  const totalDebt = musdWad != null && musdWad > 0n
    ? previewDebt({ amount: musdWad, rateWad: rate, currentDebt: 0n, gas, opening: true })
    : 0n;
  const debtForColl = musdWad != null && feeReady ? musdWad + feeRead.data! + gas : totalDebt;
  const collWei = price > 0n && debtForColl > 0n ? collateralForRatio(debtForColl, price, pct) : null;
  const ratio = pct;
  const health = loanHealth(ratio);
  const liq = collWei && mcr > 0n && debtForColl > 0n ? liquidationPrice(debtForColl, collWei, mcr) : null;
  const belowMin = musdWad != null && musdWad > 0n && musdWad < minDebt;
  const ready = musdWad != null && musdWad >= minDebt && price > 0n && feeReady && collWei != null && collWei > 0n;
  const short = isConnected && btc != null && collWei != null && btc < collWei;
  const musdNaira = !fx.loading && musdWad != null && musdWad > 0n ? formatNaira(musdToNaira(musdWad, fx.ngnPerUsd)) : null;
  const totalNaira = !fx.loading && debtForColl > 0n ? formatNaira(musdToNaira(debtForColl, fx.ngnPerUsd)) : null;
  const liqNaira = !fx.loading && liq != null ? formatNaira(musdToNaira(liq, fx.ngnPerUsd)) : null;
  const collNaira = !fx.loading && collWei && price > 0n ? formatNaira(musdToNaira((collWei * price) / WAD, fx.ngnPerUsd)) : null;
  const feePct = rate > 0n ? `${wadToPct(rate)}%` : "…";
  const presets = !fx.loading
    ? PRESET_MUSD.map((musd) => ({ musd, naira: presetNaira(musd, fx.ngnPerUsd) }))
    : [];
  const span = GUIDE_MAX_ICR_PCT - floor;
  const dangerEnd = span <= 0 ? 0 : (Math.max(0, Math.min(120, GUIDE_MAX_ICR_PCT) - floor) / span) * 100;
  const warnEnd = span <= 0 ? dangerEnd : (Math.max(0, Math.min(150, GUIDE_MAX_ICR_PCT) - floor) / span) * 100;
  const track = `linear-gradient(90deg, var(--pepper-red) 0 ${dangerEnd}%, var(--amber) ${dangerEnd}% ${warnEnd}%, var(--palm) ${warnEnd}% 100%)`;
  const busy = phase === "wallet" || phase === "chain";

  function pickPreset(naira: bigint) {
    setUnit("ngn");
    setText(naira.toString());
  }

  function switchUnit(next: "musd" | "ngn") {
    if (next === unit) return;
    if (next === "ngn" && musdWad != null && musdWad > 0n && !fx.loading) {
      setText(musdToNaira(musdWad, fx.ngnPerUsd).toString());
    } else if (next === "musd" && musdWad != null && musdWad > 0n) {
      const whole = musdWad / WAD;
      const frac = (musdWad % WAD) / (WAD / 100n);
      setText(frac > 0n ? `${whole}.${frac.toString().padStart(2, "0")}` : whole.toString());
    }
    setUnit(next);
  }

  async function confirm() {
    if (!publicClient || !ready || !collWei || !musdWad || short) return;
    setError("");
    setPhase("wallet");
    try {
      if (!address) throw new WalletNotConnectedError();
      await ensureBitcoinAccount(connector);
      if (chainId !== MEZO_TESTNET.chainId) await switchChainAsync({ chainId: MEZO_TESTNET.chainId });
      const hints = await findTroveHints(publicClient, collWei, debtForColl);
      const hash = await sendContractWrite(config, connector, address, {
        address: CONTRACTS.BorrowerOperations,
        abi: borrowerOpsAbi,
        functionName: "openTrove",
        args: [musdWad, hints.upper, hints.lower],
        value: collWei,
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

  const rows = ready
    ? [
        { label: t("guide.borrowed"), value: `${formatMusd(musdWad!)} MUSD${musdNaira ? ` · ${musdNaira}` : ""}` },
        { label: t("guide.fee", { pct: feePct }), value: `${formatMusd(fee)} MUSD` },
        { label: t("guide.gas"), value: `${formatMusd(gas, 0)} MUSD` },
        { label: t("guide.total"), value: `${formatMusd(debtForColl)} MUSD${totalNaira ? ` · ${totalNaira}` : ""}` },
        { label: t("guide.ratio"), value: `${Math.round(ratio)}% · ${t(`health.${health}`)}` },
        { label: t("home.liq"), value: liq ? `${formatUsd(liq)}${liqNaira ? ` · ${liqNaira}` : ""}` : "—" },
      ]
    : [
        { label: t("guide.borrowed"), value: "—" },
        { label: t("guide.total"), value: "—" },
        { label: t("guide.ratio"), value: `${Math.round(pct)}%` },
      ];

  return (
    <main className="screen form-page">
      <div className="form-main">
        <h1>{t("borrow.title")}</h1>
        <RecoveryBanner />
        <section className="card">
          <div className="split">
            <span className="label">{t("guide.want")}</span>
            <RateLine />
          </div>
          <div className="unit-pills" role="group" aria-label={t("guide.want")}>
            <button type="button" aria-pressed={unit === "musd"} onClick={() => switchUnit("musd")}>MUSD</button>
            <button type="button" aria-pressed={unit === "ngn"} onClick={() => switchUnit("ngn")}>{t("guide.naira")}</button>
          </div>
          <div className="presets">
            {presets.map((preset) => (
              <button
                key={preset.musd}
                type="button"
                aria-pressed={unit === "ngn" && text === preset.naira.toString()}
                onClick={() => pickPreset(preset.naira)}
              >
                {formatNaira(preset.naira)}
              </button>
            ))}
          </div>
          <input
            className="bare"
            inputMode="decimal"
            aria-label={t("guide.want")}
            value={text}
            onChange={(event) => setText(unit === "ngn" ? event.target.value.replace(/[^\d]/g, "") : event.target.value)}
          />
          <div className="naira" style={{ color: "var(--kola-green)" }}>
            {unit === "musd" ? (musdNaira ? `(~ ${musdNaira})` : "") : musdWad != null && musdWad > 0n ? `${formatMusd(musdWad)} MUSD` : ""}
          </div>
          {belowMin ? <p className="note" style={{ marginTop: 8 }}>{t("borrow.belowMin", { amount: formatMusd(minDebt, 0) })}</p> : null}
        </section>

        <section className="card">
          <div className="btc-row">
            <BtcMark size={40} />
            <div>
              <strong>{t("guide.btcFor")}</strong>
              <div className="caption">{t("guide.btcForBody", { pct: Math.round(pct) })}</div>
            </div>
          </div>
          <div className="amount" style={{ fontSize: 28, marginTop: 8 }}>{collWei ? `${formatBtc(collWei)} BTC` : "—"}</div>
          <div className="caption">{collNaira ? `~ ${collNaira}` : btc != null ? `${t("borrow.wallet")} ${formatBtc(btc)} BTC` : ""}</div>
          <div className="label" style={{ marginTop: 12 }}>{t("guide.slider")}</div>
          <div className="slider-track" style={{ ["--track" as string]: track }}>
            <input
              className={`slider zones ${health}`}
              type="range"
              min={floor}
              max={GUIDE_MAX_ICR_PCT}
              step={1}
              value={pct}
              aria-label={t("guide.slider")}
              aria-valuetext={`${Math.round(pct)}% ${t(`health.${health}`)}`}
              onChange={(event) => setTargetPct(Number(event.target.value))}
            />
          </div>
          <div className="range-labels">
            <span>{floor}%</span>
            <strong>{Math.round(pct)}% · {t(`health.${health}`)}</strong>
            <span>{GUIDE_MAX_ICR_PCT}%</span>
          </div>
        </section>

        {ready ? (
          <section className="card">
            <h3>{t("guide.breakdown")}</h3>
            <ul className="breakdown">
              <li>
                <span className="caption">{t("guide.borrowed")}</span>
                <strong>{formatMusd(musdWad!)} MUSD</strong>
                {musdNaira ? <span className="caption">(~ {musdNaira})</span> : null}
              </li>
              <li>
                <span className="caption">{t("guide.fee", { pct: feePct })}</span>
                <strong>{formatMusd(feeRead.data!)} MUSD</strong>
              </li>
              <li>
                <span className="caption">{t("guide.gas")}</span>
                <strong>{formatMusd(gas, 0)} MUSD</strong>
                <span className="caption">{t("guide.gasBack", { gas: formatMusd(gas, 0) })}</span>
              </li>
              <li>
                <span className="caption">{t("guide.total")}</span>
                <strong>{formatMusd(debtForColl)} MUSD</strong>
                {totalNaira ? <span className="caption">(~ {totalNaira})</span> : null}
              </li>
              <li>
                <span className="caption">{t("guide.ratio")}</span>
                <strong>{Math.round(ratio)}% · {t(`health.${health}`)}</strong>
              </li>
              <li>
                <span className="caption">{t("home.liq")}</span>
                <strong>{liq ? formatUsd(liq) : "—"}</strong>
                {liqNaira ? <span className="caption">(≈ {liqNaira})</span> : null}
              </li>
            </ul>
          </section>
        ) : null}

        {!price && !protocol.priceError ? <p className="note" style={{ marginBottom: 8 }}>{t("common.loading")}</p> : null}
        {short && collWei ? (
          <p className="note" style={{ marginBottom: 8 }}>{t("guide.shortBtc", { have: formatBtc(btc ?? 0n), need: formatBtc(collWei) })}</p>
        ) : null}
        {error ? <p className="error" style={{ marginBottom: 8 }}>{error}</p> : null}
        {phase === "done" && tx ? (
          <p className="ok" style={{ marginBottom: 8 }}>{t("borrow.done")} <a href={txUrl(tx)}>{t("receipt.explorer")}</a></p>
        ) : null}

        {isConnected ? (
          <button className="btn" type="button" disabled={!ready || short || busy} onClick={confirm}>
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
      <SideSummary title={t("layout.summary")} rows={rows} />
    </main>
  );
}

"use client";

import Link from "next/link";
import { RateLine } from "@/components/RateLine";
import { RecoveryBanner } from "@/components/RecoveryBanner";
import { BottomWave, BtcMark, LinkIcon, PlantArt, SendIcon, ShieldIcon, SwapIcon, WalletIcon } from "@/components/Illustrations";
import { useFx } from "@/hooks/useFx";
import { usePosition } from "@/hooks/useMezo";
import { useI18n } from "@/i18n/I18nProvider";
import { loanHealth } from "@/lib/health";
import { btcToNaira, formatBtc, formatMusd, formatNaira, formatUsd, musdToNaira } from "@/lib/format";
import { liquidationPrice } from "@/lib/loan";

const actions = [
  { href: "/borrow", key: "actions.borrow", icon: WalletIcon },
  { href: "/swap", key: "actions.swap", icon: SwapIcon },
  { href: "/send", key: "actions.send", icon: SendIcon },
  { href: "/pay-link/new", key: "actions.payLink", icon: LinkIcon },
] as const;

export default function Home() {
  const { t } = useI18n();
  const fx = useFx();
  const { isConnected, musd, btc, coll, debt, ratioPct, protocol, loading } = usePosition();
  const health = ratioPct == null ? null : loanHealth(ratioPct);
  const liq = coll && debt && protocol.mcr ? liquidationPrice(debt, coll, protocol.mcr) : null;
  const musdNaira = !fx.loading && musd != null ? formatNaira(musdToNaira(musd, fx.ngnPerUsd)) : null;
  const btcNaira = !fx.loading && btc != null && protocol.price ? formatNaira(btcToNaira(btc, protocol.price, fx.ngnPerUsd)) : null;
  const liqNaira = !fx.loading && liq != null ? formatNaira(musdToNaira(liq, fx.ngnPerUsd)) : null;

  return (
    <main className="screen">
      <RecoveryBanner />
      <section className="hero-balance">
        <div className="label">{t("home.musd")}</div>
        <div className="figure">
          <span className="amount big">{isConnected ? (musd == null ? "…" : formatMusd(musd)) : "—"}</span>
          <span className="unit">MUSD</span>
        </div>
        <div className="naira">{isConnected && musdNaira ? `(~ ${musdNaira})` : isConnected ? "(~ …)" : t("home.connect")}</div>
        <div className="rate-chip">
          <RateLine tone="on-green" />
        </div>
        <PlantArt />
      </section>

      <section className="card btc-row">
        <BtcMark size={52} />
        <div className="btc-copy">
          <div className="label">{t("home.btc")}</div>
          <div className="amount" style={{ fontSize: 22 }}>{isConnected ? (btc == null ? "…" : `${formatBtc(btc)} BTC`) : "— BTC"}</div>
          <div className="caption">{isConnected && btcNaira ? `(~ ${btcNaira})` : loading ? t("common.loading") : ""}</div>
        </div>
      </section>

      <section className="card loan-card">
        <h3>{t("home.loan")}</h3>
        {health && ratioPct != null ? (
          <div className="loan-grid">
            <div>
              <div className="caption">{t("home.ratio")}</div>
              <div className="pct">{Math.round(ratioPct)}%</div>
            </div>
            <div>
              <div className="caption">{t("home.liq")}</div>
              <div className="px">{liq ? formatUsd(liq) : "—"}</div>
              <div className="sub">{liqNaira ? `(= ${liqNaira})` : ""}</div>
            </div>
            <span className={`badge ${health}`}>
              <ShieldIcon />
              {t(`health.${health}`)}
            </span>
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            <strong>{isConnected ? t("home.noLoan") : "—"}</strong>
            <p className="note" style={{ marginTop: 4 }}>{isConnected ? t("home.noLoanBody") : t("home.connect")}</p>
          </div>
        )}
      </section>

      <h3 style={{ margin: "16px 0 8px" }}>{t("home.actions")}</h3>
      <nav className="actions" aria-label={t("home.actions")}>
        {actions.map((item) => (
          <Link key={item.href} href={item.href}>
            <span className="ico"><item.icon /></span>
            {t(item.key)}
          </Link>
        ))}
      </nav>
      {protocol.priceError ? <p className="error" style={{ marginTop: 12 }}>{t("common.loading")}</p> : null}
      <BottomWave />
    </main>
  );
}

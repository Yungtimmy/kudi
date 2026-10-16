"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ActivityCard } from "@/components/ActivityCard";
import { RateLine } from "@/components/RateLine";
import { RecoveryBanner } from "@/components/RecoveryBanner";
import { BottomWave, BtcMark, LinkIcon, PlantArt, SendIcon, ShieldIcon, SwapIcon, WalletIcon } from "@/components/Illustrations";
import { useFx } from "@/hooks/useFx";
import { usePosition } from "@/hooks/useMezo";
import { useI18n } from "@/i18n/I18nProvider";
import { loanHealth } from "@/lib/health";
import { btcToNaira, formatBtc, formatMusd, formatNaira, formatUsd, musdToNaira, WAD } from "@/lib/format";
import { liquidationPrice } from "@/lib/loan";
import { MEZO_TESTNET, parseViewAddress, viewAddr } from "@/lib/mezo";

const actions = [
  { href: "/borrow", key: "actions.borrow", icon: WalletIcon },
  { href: "/swap", key: "actions.swap", icon: SwapIcon },
  { href: "/send", key: "actions.send", icon: SendIcon },
  { href: "/pay-link/new", key: "actions.payLink", icon: LinkIcon },
] as const;

export function HomeScreen() {
  const { t } = useI18n();
  const fx = useFx();
  const view = parseViewAddress(useSearchParams().get("address"));
  const { address, isConnected, watching, musd, btc, coll, debt, ratioPct, protocol, loading } = usePosition(view.address);
  const health = ratioPct == null ? null : loanHealth(ratioPct);
  const liq = coll && debt && protocol.mcr ? liquidationPrice(debt, coll, protocol.mcr) : null;
  const musdNaira = !fx.loading && musd != null ? formatNaira(musdToNaira(musd, fx.ngnPerUsd)) : null;
  const btcNaira = !fx.loading && btc != null && protocol.price ? formatNaira(btcToNaira(btc, protocol.price, fx.ngnPerUsd)) : null;
  const liqNaira = !fx.loading && liq != null ? formatNaira(musdToNaira(liq, fx.ngnPerUsd)) : null;
  const priceNaira = !fx.loading && protocol.price ? formatNaira(btcToNaira(WAD, protocol.price, fx.ngnPerUsd)) : null;
  const show = Boolean(address) && !view.invalid;

  if (view.invalid) {
    return (
      <main className="screen stage">
        <section className="card">
          <h3>{t("home.badAddressTitle")}</h3>
          <p className="note" style={{ marginTop: 8 }}>{t("home.badAddress")}</p>
          <Link href="/home" className="btn outline" style={{ marginTop: 16, textDecoration: "none" }}>
            <span />
            <span>{t("home.exit")}</span>
            <span />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="screen home-dash">
      {watching && address ? (
        <div className="viewbar" role="status">
          <span>{t("home.viewing", { address: viewAddr(address) })}</span>
          <Link href="/home">{t("home.exit")}</Link>
        </div>
      ) : null}
      <RecoveryBanner />
      <section className="hero-balance">
        <div className="label">{t("home.musd")}</div>
        <div className="figure">
          <span className="amount big">{show ? (musd == null ? "…" : formatMusd(musd)) : "—"}</span>
          <span className="unit">MUSD</span>
        </div>
        <div className="naira">{show && musdNaira ? `(~ ${musdNaira})` : "(~ ₦—)"}</div>
        <div className="rate-chip">
          <RateLine tone="on-green" />
        </div>
        <PlantArt />
      </section>

      <section className="card btc-row">
        <BtcMark size={52} />
        <div className="btc-copy">
          <div className="label">{t("home.btc")}</div>
          <div className="amount" style={{ fontSize: 22 }}>{show ? (btc == null ? "…" : `${formatBtc(btc)} BTC`) : "— BTC"}</div>
          <div className="caption">{show && btcNaira ? `(~ ${btcNaira})` : loading ? t("common.loading") : ""}</div>
        </div>
      </section>

      {isConnected && !watching && btc === 0n ? (
        <section className="card faucet-card">
          <h3>{t("home.getBtcTitle")}</h3>
          <p className="note" style={{ margin: "8px 0 12px" }}>{t("home.getBtcBody")}</p>
          <a className="btn" href={MEZO_TESTNET.faucet} target="_blank" rel="noreferrer">
            <span />
            <span>{t("home.getBtcAction")}</span>
            <span />
          </a>
        </section>
      ) : null}
      {isConnected && !watching && !loading && coll == null && btc != null && btc > 0n ? (
        <section className="card faucet-card">
          <h3>{t("home.borrowNowTitle")}</h3>
          <p className="note" style={{ margin: "8px 0 12px" }}>{t("home.borrowNowBody")}</p>
          <Link className="btn" href="/borrow">
            <span />
            <span>{t("home.borrowNow")}</span>
            <span />
          </Link>
        </section>
      ) : null}

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
            <strong>{show ? (loading ? "…" : t("home.noLoan")) : "—"}</strong>
            <p className="note" style={{ marginTop: 4 }}>
              {show ? (loading ? t("common.loading") : t("home.noLoanBody")) : t("home.connect")}
            </p>
          </div>
        )}
      </section>

      <section className="card price-card wide-only">
        <div className="label">{t("home.btcPrice")}</div>
        <div className="amount" style={{ fontSize: 28, marginTop: 8 }}>
          {protocol.price ? formatUsd(protocol.price) : protocol.priceError ? "—" : "…"}
        </div>
        <div className="naira" style={{ color: "var(--kola-green)" }}>{priceNaira ? `(~ ${priceNaira})` : ""}</div>
        <div style={{ marginTop: 8 }}><RateLine /></div>
      </section>

      <ActivityCard address={show ? address : undefined} />

      <h3 className="mobile-only" style={{ margin: "16px 0 8px" }}>{t("home.actions")}</h3>
      <nav className="actions mobile-only" aria-label={t("home.actions")}>
        {actions.map((item) =>
          watching ? (
            <button key={item.href} type="button" disabled aria-describedby="readonly-actions">
              <span className="ico"><item.icon /></span>
              {t(item.key)}
            </button>
          ) : (
            <Link key={item.href} href={item.href}>
              <span className="ico"><item.icon /></span>
              {t(item.key)}
            </Link>
          ),
        )}
      </nav>
      {watching ? <p id="readonly-actions" className="note readonly-note" style={{ marginTop: 10 }}>{t("home.readonlyActions")}</p> : null}
      {protocol.priceError ? <p className="error" style={{ marginTop: 12 }}>{t("common.loading")}</p> : null}
      <BottomWave />
    </main>
  );
}

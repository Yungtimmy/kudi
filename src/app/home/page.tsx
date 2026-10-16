"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { loanHealth, healthColor } from "@/lib/health";
export default function Home() {
  const { t } = useI18n(); const ratio = 165; const h = loanHealth(ratio); // example value
  return (<main className="screen"><h1>{t("home.title")}</h1>
    <div className="card"><h3>{t("home.balances")}</h3><div className="amount big">— MUSD</div><p className="caption">{t("rate.asOf", { time: "--:--" })}</p></div>
    <div className="card" style={{ borderLeft: `6px solid ${healthColor[h]}` }}><h3>{t("home.loanHealth")}</h3><div className="amount">{ratio}% · {t(`health.${h}`)}</div></div>
    <nav className="grid"><Link href="/borrow">{t("actions.borrow")}</Link><Link href="/swap">{t("actions.swap")}</Link><Link href="/send">{t("actions.send")}</Link><Link href="/pay-link/new">{t("actions.payLink")}</Link></nav>
  </main>);
}

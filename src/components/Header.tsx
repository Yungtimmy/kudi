"use client";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LanguageToggle } from "./LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";
export function Header() {
  const { t } = useI18n();
  return (<header className="header">
    <Link href="/" className="logo">kud<span className="coin">i</span></Link>
    <span className="pill">{t("app.testnet")}</span>
    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}><LanguageToggle /><ConnectButton showBalance={false} chainStatus="none" /></div>
  </header>);
}

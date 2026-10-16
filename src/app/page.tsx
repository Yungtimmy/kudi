"use client";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useI18n } from "@/i18n/I18nProvider";
export default function Landing() {
  const { t } = useI18n(); const { isConnected } = useAccount();
  return (<main className="screen"><h1>{t("landing.title")}</h1>
    {isConnected ? <Link className="btn" href="/home">{t("home.title")}</Link> : <ConnectButton label={t("landing.connect")} />}
  </main>);
}

"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Adire, BridgeScene, BtcMark, MezoMark } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { useI18n } from "@/i18n/I18nProvider";

export default function Landing() {
  const { t } = useI18n();
  const { isConnected } = useAccount();
  return (
    <main className="screen">
      <Adire />
      <section className="hero">
        <h1>
          {t("landing.heroTitle")}
          <span className="accent">{t("landing.heroAccent")}</span>
        </h1>
        <BtcMark />
        <BridgeScene />
      </section>
      {isConnected ? (
        <Link className="btn" href="/home">
          <MezoMark />
          <span>{t("landing.open")}</span>
          <span />
        </Link>
      ) : (
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button className="btn" type="button" disabled={!mounted} onClick={openConnectModal}>
              <MezoMark />
              <span>{t("landing.connect")}</span>
              <span />
            </button>
          )}
        </ConnectButton.Custom>
      )}
      <RateLine tone="pill" />
    </main>
  );
}

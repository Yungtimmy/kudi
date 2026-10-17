"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { PassportConnect } from "@/components/PassportConnect";
import { Adire, BridgeScene, BtcMark, MezoMark } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { useI18n } from "@/i18n/I18nProvider";

export default function Landing() {
  const { t } = useI18n();
  const { isConnected } = useAccount();
  return (
    <main className="screen landing stage">
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
        <PassportConnect icon={<MezoMark />} />
      )}
      <RateLine tone="pill" />
    </main>
  );
}

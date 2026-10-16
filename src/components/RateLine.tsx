"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { formatHm, formatNaira } from "@/lib/format";
import { useFx } from "@/hooks/useFx";
import { BoltIcon, ClockIcon } from "./Illustrations";

export function RateLine({ tone = "plain" }: { tone?: "plain" | "on-green" | "pill" }) {
  const { t } = useI18n();
  const fx = useFx();
  const time = fx.loading ? "--:--" : formatHm(fx.asOf);
  const label = t("rate.asOf", { time });
  if (tone === "pill") {
    return (
      <p className={`rate-pill ${fx.source === "fallback" && !fx.loading ? "is-backup" : ""}`}>
        <BoltIcon width={16} height={16} />
        <span>{t("landing.rate", { naira: fx.loading ? "…" : formatNaira(BigInt(Math.round(fx.ngnPerUsd))), rate: label })}</span>
        {fx.source === "fallback" && !fx.loading ? <span className="backup">{t("rate.backup")}</span> : null}
      </p>
    );
  }
  return (
    <p className={`rate-line tone-${tone}`}>
      <ClockIcon width={14} height={14} />
      <span>{label}</span>
      {fx.source === "fallback" && !fx.loading ? <span className="backup">{t("rate.backup")}</span> : null}
    </p>
  );
}

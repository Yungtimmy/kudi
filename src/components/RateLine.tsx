"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { formatNaira } from "@/lib/format";
import { useFx } from "@/hooks/useFx";
import { BoltIcon } from "./Illustrations";

/** Naira rate line. No last-updated time is shown to users. */
export function RateLine({ tone = "plain" }: { tone?: "plain" | "on-green" | "pill" }) {
  const { t } = useI18n();
  const fx = useFx();
  if (tone === "pill") {
    return (
      <p className={`rate-pill ${fx.source === "fallback" && !fx.loading ? "is-backup" : ""}`}>
        <BoltIcon width={16} height={16} />
        <span>{t("landing.rate", { naira: fx.loading ? "…" : formatNaira(BigInt(Math.round(fx.ngnPerUsd))) })}</span>
        {fx.source === "fallback" && !fx.loading ? <span className="backup">{t("rate.backup")}</span> : null}
      </p>
    );
  }
  if (fx.source !== "fallback" || fx.loading) return null;
  return (
    <p className={`rate-line tone-${tone}`}>
      <span className="backup">{t("rate.backup")}</span>
    </p>
  );
}

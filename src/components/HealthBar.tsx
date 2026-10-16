"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { loanHealth, type Health } from "@/lib/health";

const SCALE_MIN = 100;
const SCALE_MAX = 220;

export function HealthBar({ ratio }: { ratio: number | null }) {
  const { t } = useI18n();
  const health: Health | null = ratio == null ? null : loanHealth(ratio);
  const clamped = ratio == null ? SCALE_MIN : Math.min(SCALE_MAX, Math.max(SCALE_MIN, ratio));
  // Higher collateral sits on the left, with the palm zone. Danger is on the right.
  const left = ((SCALE_MAX - clamped) / (SCALE_MAX - SCALE_MIN)) * 100;
  return (
    <div className="health-block">
      <div className="label-row">
        <span>{t("health.title")}</span>
      </div>
      <div className="hbar" role="img" aria-label={health ? `${Math.round(ratio ?? 0)}% ${t(`health.${health}`)}` : t("health.title")}>
        <span className="zone zone-safe" />
        <span className="zone zone-warning" />
        <span className="zone zone-danger" />
        {ratio != null ? (
          <span className={`hbar-thumb thumb-${health}`} style={{ left: `${left}%` }}>
            {Math.round(ratio)}%
          </span>
        ) : null}
      </div>
      <div className="hbar-key">
        <div>
          <strong className="key-safe">{t("health.safe")}</strong>
          <span>{t("health.safeNote")}</span>
        </div>
        <div>
          <strong className="key-warning">{t("health.warning")}</strong>
          <span>{t("health.warningNote")}</span>
        </div>
        <div>
          <strong className="key-danger">{t("health.danger")}</strong>
          <span>{t("health.dangerNote")}</span>
        </div>
      </div>
    </div>
  );
}

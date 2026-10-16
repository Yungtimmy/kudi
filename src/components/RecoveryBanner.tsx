"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { useProtocol } from "@/hooks/useMezo";

export function RecoveryBanner() {
  const { t } = useI18n();
  const { recovery, tcrPct } = useProtocol();
  if (!recovery || tcrPct == null) return null;
  return (
    <p className="recovery" role="status">
      {t("recovery.banner", { pct: `${Math.round(tcrPct)}%` })}
    </p>
  );
}

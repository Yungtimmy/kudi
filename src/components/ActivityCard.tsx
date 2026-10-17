"use client";

import type { Address } from "viem";
import { useFx } from "@/hooks/useFx";
import { useActivity } from "@/hooks/useActivity";
import { useReconnectPending } from "@/hooks/useReconnectPending";
import { useI18n } from "@/i18n/I18nProvider";
import { formatMusd, formatNaira, formatWhen, musdToNaira } from "@/lib/format";
import { shortAddr, txUrl } from "@/lib/mezo";

export function ActivityCard({ address, paused = false }: { address?: Address; paused?: boolean }) {
  const { t } = useI18n();
  const reconnecting = useReconnectPending();
  const fx = useFx();
  const activity = useActivity(address, !paused);
  const rows = activity.data ?? [];

  return (
    <section className="card activity-card wide-only">
      <h3>{t("home.activity")}</h3>
      {!address ? <p className="note" style={{ marginTop: 8 }}>{reconnecting ? t("wallet.reconnecting") : t("home.activityConnect")}</p> : null}
      {address && rows.length === 0 && !activity.isError && (paused || activity.isFetching) ? (
        <div className="skel-stack" role="status" aria-label={t("common.loading")}>
          <span className="skel wide" />
          <span className="skel" />
        </div>
      ) : null}
      {address && activity.isError ? <p className="error" style={{ marginTop: 8 }}>{t("home.activityError")}</p> : null}
      {address && activity.isSuccess && rows.length === 0 ? (
        <p className="note" style={{ marginTop: 8 }}>{t("home.activityEmpty")}</p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="activity-list">
          {rows.map((row) => {
            const naira = fx.loading ? null : formatNaira(musdToNaira(row.value, fx.ngnPerUsd));
            return (
              <li key={row.id}>
                <a href={txUrl(row.hash)}>
                  <span className={`activity-dir ${row.direction}`}>{t(row.direction === "out" ? "home.sent" : "home.received")}</span>
                  <span>
                    <strong className="amount">{formatMusd(row.value)} MUSD</strong>
                    <span className="caption">
                      {naira ? `(~ ${naira}) · ` : ""}
                      {shortAddr(row.counterparty)}
                      {row.when ? ` · ${formatWhen(row.when)}` : ""}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

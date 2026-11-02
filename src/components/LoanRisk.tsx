"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { useFx } from "@/hooks/useFx";
import { useProtocol, useRedemptionHead } from "@/hooks/useMezo";
import { loanHealth } from "@/lib/health";
import { btcToNaira, formatMusd, formatNaira, formatUsd, musdToNaira, WAD } from "@/lib/format";
import { wadToPct } from "@/lib/loan";
import { MEZO_TESTNET, viewAddr } from "@/lib/mezo";

type Props = {
  /** Contract ICR for an open loan. */
  liveIcrPct?: number;
  /** Ratio this form would leave, when it differs from the live loan. */
  previewIcrPct?: number | null;
  /** MUSD the contract will still issue against the Bitcoin on screen. */
  maxBorrow?: bigint | null;
  /** Copy used while `maxBorrow` is still unknown. */
  maxIdle?: "wait" | "need" | "none";
  /** "ceiling" is the most a new deposit can back. "more" is extra MUSD on a loan that already exists. */
  maxTone?: "more" | "ceiling";
  /** Stored ceiling, whole MUSD wad, when this loan already has one. */
  capMusd?: bigint;
  capBinds?: boolean;
  user?: string;
};

function pctText(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function LoanRisk(props: Props) {
  const { t } = useI18n();
  const fx = useFx();
  const protocol = useProtocol();
  const redemption = useRedemptionHead(protocol.price, protocol.mcr);
  const head = redemption.head;
  const price = protocol.price;
  const oracleNaira = !fx.loading && price != null && price > 0n
    ? formatNaira(btcToNaira(WAD, price, fx.ngnPerUsd))
    : null;
  const maxNaira = !fx.loading && props.maxBorrow != null && props.maxBorrow > 0n
    ? formatNaira(musdToNaira(props.maxBorrow, fx.ngnPerUsd))
    : null;
  const yours = props.previewIcrPct ?? props.liveIcrPct;
  const showAfter = props.liveIcrPct != null
    && props.previewIcrPct != null
    && Math.round(props.previewIcrPct) !== Math.round(props.liveIcrPct);
  const fee = protocol.redemptionRate != null ? `${pctText(wadToPct(protocol.redemptionRate))}%` : null;
  const mcr = protocol.mcrPct != null ? String(Math.round(protocol.mcrPct)) : "110";
  const open = protocol.tcrPct != null && protocol.mcrPct != null && protocol.tcrPct >= protocol.mcrPct;
  const isHead = props.user != null && head != null && props.user.toLowerCase() === head.address.toLowerCase();
  const front = isHead || (yours != null && head != null && Math.round(yours) <= Math.round(head.icrPct) + 5);
  const oracleHref = protocol.oracle ? `${MEZO_TESTNET.explorer}/address/${protocol.oracle}` : undefined;

  let icrLine = t("risk.icrNone");
  if (props.liveIcrPct != null) {
    icrLine = t("risk.icrLive", { pct: String(Math.round(props.liveIcrPct)), health: t(`health.${loanHealth(props.liveIcrPct)}`) });
  } else if (props.previewIcrPct != null) {
    icrLine = t("risk.icrPreview", { pct: String(Math.round(props.previewIcrPct)), health: t(`health.${loanHealth(props.previewIcrPct)}`) });
  }

  const idleKey = props.maxIdle === "need" ? "risk.maxNeed" : props.maxIdle === "none" ? "risk.maxNone" : "risk.maxWait";
  let maxLine = t(idleKey);
  if (props.maxBorrow != null && props.maxBorrow > 0n) {
    const amount = formatMusd(props.maxBorrow, 0);
    if (props.maxTone === "ceiling") {
      maxLine = maxNaira
        ? t("risk.maxCeiling", { amount, naira: maxNaira })
        : t("risk.maxCeilingNoNaira", { amount });
    } else {
      maxLine = maxNaira
        ? t("risk.maxBody", { amount, naira: maxNaira })
        : t("risk.maxBodyNoNaira", { amount });
    }
  } else if (props.maxBorrow === 0n) {
    maxLine = t("risk.maxZero");
  }

  let redeemLine = t("risk.redeemWait");
  if (fee && protocol.tcrPct != null) {
    redeemLine = open
      ? t("risk.redeemOpen", { fee, mcr })
      : t("risk.redeemClosed", { mcr });
  }
  let queueLine = "";
  if (open && !redemption.settled) queueLine = t("risk.redeemQueue");
  else if (open && head == null && protocol.tcrPct != null) queueLine = t("risk.redeemNone");
  else if (open && head != null && yours != null) {
    queueLine = front
      ? t("risk.redeemFront", { pct: String(Math.round(head.icrPct)), yours: String(Math.round(yours)) })
      : t("risk.redeemFar", { pct: String(Math.round(head.icrPct)), yours: String(Math.round(yours)) });
  } else if (open && head != null) {
    queueLine = t("risk.redeemHeadOnly", { pct: String(Math.round(head.icrPct)) });
  }

  return (
    <section className="card risk-card" aria-label={t("risk.title")}>
      <h3>{t("risk.title")}</h3>
      <dl className="risk-dl">
        <div>
          <dt>{t("risk.oracle")}</dt>
          <dd>
            {price != null && price > 0n
              ? (oracleNaira ? t("risk.oracleLive", { usd: formatUsd(price), naira: oracleNaira }) : t("risk.oracleLiveNoNaira", { usd: formatUsd(price) }))
              : protocol.priceError
                ? t("risk.oracleDown")
                : t("common.loading")}
            {oracleHref && protocol.oracle ? (
              <span className="sub"><a href={oracleHref}>{t("risk.oracleAddr", { address: viewAddr(protocol.oracle) })}</a></span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>{t("risk.icr")}</dt>
          <dd>
            {icrLine}
            {showAfter && props.previewIcrPct != null ? (
              <span className="sub">{t("risk.after", { pct: String(Math.round(props.previewIcrPct)), health: t(`health.${loanHealth(props.previewIcrPct)}`) })}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>{t("risk.max")}</dt>
          <dd>
            {maxLine}
            {props.capBinds && props.capMusd != null ? (
              <span className="sub">{t("risk.maxCap", { cap: formatMusd(props.capMusd, 0) })}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>{t("risk.redeem")}</dt>
          <dd>
            {redeemLine}
            {queueLine ? <span className="sub">{queueLine}</span> : null}
          </dd>
        </div>
      </dl>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Hex } from "viem";
import { usePublicClient } from "wagmi";
import { BottomWave, CheckIcon, ClockIcon, CopyIcon, ExternalIcon, HashIcon, PeopleIcon, ShieldIcon } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { useFx } from "@/hooks/useFx";
import { useI18n } from "@/i18n/I18nProvider";
import { erc20Abi } from "@/lib/abi";
import { CONTRACTS, MEZO_TESTNET, shortAddr, txUrl } from "@/lib/mezo";
import { formatMusd, formatNaira, formatWhen, musdToNaira, parseAmount } from "@/lib/format";
import { loadReceipt, type ReceiptMeta } from "@/lib/paylink";
import { decodeEventLog } from "viem";

type View = {
  status: "pending" | "success" | "failed" | "missing";
  amount?: bigint;
  to?: string;
  when?: number;
  name?: string;
};

export default function ReceiptPage() {
  const { t } = useI18n();
  const fx = useFx();
  const params = useParams<{ hash: string }>();
  const hash = params.hash;
  const client = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const [meta, setMeta] = useState<ReceiptMeta | null>(null);
  const [view, setView] = useState<View>({ status: "pending" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMeta(loadReceipt(hash));
  }, [hash]);

  useEffect(() => {
    if (!client || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      setView({ status: "missing" });
      return;
    }
    let gone = false;
    (async () => {
      try {
        const receipt = await client.getTransactionReceipt({ hash: hash as Hex });
        const block = await client.getBlock({ blockNumber: receipt.blockNumber });
        let amount: bigint | undefined;
        let to: string | undefined;
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== CONTRACTS.MUSD.toLowerCase()) continue;
          try {
            const decoded = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
            if (decoded.eventName !== "Transfer") continue;
            amount = decoded.args.value;
            to = decoded.args.to;
          } catch {
            /* not a transfer */
          }
        }
        if (!gone) {
          setView({
            status: receipt.status === "success" ? "success" : "failed",
            amount,
            to,
            when: Number(block.timestamp),
          });
        }
      } catch {
        if (!gone) setView({ status: "missing" });
      }
    })();
    return () => {
      gone = true;
    };
  }, [client, hash]);

  const amountWad = view.amount ?? (meta ? parseAmount(meta.amount) ?? undefined : undefined);
  const who = meta?.name || (view.to ? shortAddr(view.to) : meta ? shortAddr(meta.to) : "—");
  const naira = !fx.loading && amountWad != null ? formatNaira(musdToNaira(amountWad, fx.ngnPerUsd)) : null;
  const title = view.status === "success" ? t("receipt.title") : view.status === "failed" ? t("receipt.failed") : view.status === "missing" ? t("receipt.missing") : t("receipt.pending");

  async function copy() {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <main className="screen receipt">
      <div className={`check-badge ${view.status === "success" ? "" : "muted"}`}><CheckIcon /></div>
      <h1>{title}</h1>
      {view.status === "success" && amountWad != null ? (
        <>
          <p className="sum">{formatMusd(amountWad, amountWad % 10n ** 18n === 0n ? 0 : 2)} MUSD<span>{naira ? `(~ ${naira})` : ""}</span></p>
          <RateLine />
          <p className="who">{t("receipt.to", { name: who })}</p>
        </>
      ) : null}
      <section className="card detail">
        <div className="detail-row">
          <span className="detail-ico"><SendMini /></span>
          <div className="grow">
            <strong>{t("receipt.tx")}</strong>
            <span className="caption mono">{shortAddr(hash)}</span>
          </div>
          <button type="button" className="copy-pill" onClick={copy} aria-label={t("common.copy")}>
            <CopyIcon width={16} height={16} />
            {copied ? t("common.copied") : ""}
          </button>
        </div>
        <div className="detail-row">
          <span className="detail-ico"><ClockIcon /></span>
          <div>
            <strong>{t("receipt.when")}</strong>
            <span className="caption">{view.when ? formatWhen(view.when) : "—"}</span>
          </div>
        </div>
        <div className="detail-row">
          <span className="detail-ico"><PeopleIcon /></span>
          <div className="grow">
            <strong>{t("receipt.network")}</strong>
            <span className="caption">{t("receipt.net")}</span>
          </div>
          {view.status === "success" ? <span className="badge safe"><ShieldIcon />{t("receipt.safe")}</span> : null}
        </div>
        <div className="detail-row">
          <span className="detail-ico"><HashIcon /></span>
          <strong style={{ color: "var(--kola-green)" }}>{view.status === "success" ? t("receipt.completed") : title}</strong>
        </div>
      </section>
      <a className="btn outline" href={txUrl(hash)}>
        <ExternalIcon width={18} height={18} />
        <span>{t("receipt.explorer")}</span>
        <span />
      </a>
      <BottomWave />
    </main>
  );
}

function SendMini() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

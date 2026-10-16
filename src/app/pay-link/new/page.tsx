"use client";

import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { BottomWave, CopyIcon, EnvelopeArt } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { useFx } from "@/hooks/useFx";
import { useI18n } from "@/i18n/I18nProvider";
import { formatNaira, musdToNaira, parseAmount } from "@/lib/format";
import { payUrl } from "@/lib/paylink";

export default function CreatePayLink() {
  const { t } = useI18n();
  const fx = useFx();
  const { address, isConnected } = useAccount();
  const [amountText, setAmountText] = useState("50");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const amount = parseAmount(amountText);
  const naira = !fx.loading && amount != null ? formatNaira(musdToNaira(amount, fx.ngnPerUsd)) : null;
  const url = useMemo(() => {
    if (!address || amount == null || amount <= 0n || typeof window === "undefined") return "";
    return payUrl(window.location.origin, { to: address, amount: amountText.trim(), name, note });
  }, [address, amount, amountText, name, note]);

  const message = url
    ? (name.trim()
      ? t("paylink.message", { name: name.trim(), amount: amountText.trim(), url })
      : t("paylink.messageAnon", { amount: amountText.trim(), url }))
    : "";

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="screen">
      <h1>{t("paylink.title")}</h1>
      <section className="request">
        <h2>{t("paylink.request")}</h2>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, position: "relative", zIndex: 1 }}>
          <input
            className="bare"
            style={{ width: 120 }}
            inputMode="decimal"
            aria-label={t("paylink.amount")}
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
          />
          <span className="amount" style={{ fontSize: 28, color: "var(--kola-green)" }}>MUSD</span>
        </div>
        <div className="naira" style={{ color: "var(--kola-green)", position: "relative", zIndex: 1 }}>
          {naira ? `(~ ${naira})` : amount != null && amount > 0n ? "" : t("paylink.badAmount")}
        </div>
        <div style={{ marginTop: 8, position: "relative", zIndex: 1 }}><RateLine /></div>
        <EnvelopeArt />
      </section>

      <label className="field">
        <span className="label">{t("paylink.name")}</span>
        <input value={name} maxLength={42} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="field">
        <span className="label">{t("paylink.note")}</span>
        <textarea value={note} maxLength={160} onChange={(event) => setNote(event.target.value)} />
      </label>

      <section className="share-card">
        <h3>{t("paylink.share")}</h3>
        {!isConnected ? <p className="note" style={{ margin: "8px 0" }}>{t("paylink.needWallet")}</p> : null}
        {amount != null && amount <= 0n ? <p className="note">{t("paylink.badAmount")}</p> : null}
        <div className="btn-row" style={{ marginTop: 12 }}>
          {isConnected ? (
            <a className="btn" href={url ? `https://wa.me/?text=${encodeURIComponent(message)}` : undefined} aria-disabled={!url}>
              <span />
              <span>{t("paylink.whatsapp")}</span>
              <span />
            </a>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button className="btn" type="button" onClick={openConnectModal}>
                  <span />
                  <span>{t("landing.connect")}</span>
                  <span />
                </button>
              )}
            </ConnectButton.Custom>
          )}
          <button className="btn outline" type="button" disabled={!url} onClick={copy}>
            <CopyIcon width={18} height={18} />
            <span>{copied ? t("common.copied") : t("paylink.copy")}</span>
            <span />
          </button>
        </div>
      </section>
      <BottomWave />
    </main>
  );
}

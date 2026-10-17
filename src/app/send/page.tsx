"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PassportConnect } from "@/components/PassportConnect";
import { isAddress } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { ArrowIcon, ShieldIcon } from "@/components/Illustrations";
import { SideSummary } from "@/components/SideSummary";
import { RateLine } from "@/components/RateLine";
import { useFx } from "@/hooks/useFx";
import { usePosition } from "@/hooks/useMezo";
import { useI18n } from "@/i18n/I18nProvider";
import { erc20Abi } from "@/lib/abi";
import { CONTRACTS, MEZO_TESTNET, shortAddr } from "@/lib/mezo";
import { formatMusd, formatNaira, musdToNaira, parseAmount, txMessage } from "@/lib/format";
import { saveReceipt } from "@/lib/paylink";

export default function SendPage() {
  const { t } = useI18n();
  const fx = useFx();
  const router = useRouter();
  const { address, isConnected, musd } = usePosition();
  const { chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const [to, setTo] = useState("");
  const [amountText, setAmountText] = useState("");
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain">("idle");
  const [error, setError] = useState("");

  const amount = parseAmount(amountText);
  const naira = !fx.loading && amount != null && amount > 0n ? formatNaira(musdToNaira(amount, fx.ngnPerUsd)) : null;
  const validTo = isAddress(to);
  const busy = phase !== "idle";

  let block = "";
  if (!validTo) block = t("send.invalid");
  else if (amount == null || amount <= 0n) block = t("send.need");
  else if (musd != null && amount > musd) block = t("send.funds");

  async function send() {
    if (!address || !publicClient || block || amount == null) return;
    setError("");
    setPhase("wallet");
    try {
      if (chainId !== MEZO_TESTNET.chainId) await switchChainAsync({ chainId: MEZO_TESTNET.chainId });
      const hash = await writeContractAsync({
        address: CONTRACTS.MUSD,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to as `0x${string}`, amount],
        chainId: MEZO_TESTNET.chainId,
      });
      setPhase("chain");
      saveReceipt(hash, { amount: amountText.trim(), to, note });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(t("receipt.failed"));
      router.push(`/receipt/${hash}`);
    } catch (err) {
      setError(txMessage(err, t("common.closed")));
      setPhase("idle");
    }
  }

  return (
    <main className="screen form-page">
      <div className="form-main">
      <h1>{t("send.title")}</h1>
      <section className="card">
        <div className="split">
          <span className="label">{t("send.amount")}</span>
          <RateLine />
        </div>
        <input
          className="bare"
          inputMode="decimal"
          aria-label={t("send.amount")}
          placeholder="0"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
        />
        <div className="naira" style={{ color: "var(--kola-green)" }}>{naira ? `(~ ${naira})` : ""} MUSD</div>
        {musd != null ? <p className="caption">{t("home.musd")}: {formatMusd(musd)} MUSD</p> : null}
      </section>
      <label className="field">
        <span className="label">{t("send.to")}</span>
        <input value={to} spellCheck={false} autoCapitalize="off" placeholder="0x…" onChange={(event) => setTo(event.target.value.trim())} />
      </label>
      <label className="field">
        <span className="label">{t("send.note")}</span>
        <textarea value={note} maxLength={160} onChange={(event) => setNote(event.target.value)} />
      </label>
      <p className="warn" style={{ marginBottom: 12 }}><ShieldIcon width={18} height={18} /> {t("pay.check")}</p>
      {to && block ? <p className="note" style={{ marginBottom: 8 }}>{block}</p> : null}
      {error ? <p className="error" style={{ marginBottom: 8 }}>{error}</p> : null}
      {isConnected ? (
        <button className="btn" type="button" disabled={Boolean(block) || busy} onClick={send}>
          <span />
          <span>{busy ? t("borrow.pending") : t("send.action")}</span>
          <span className="end"><ArrowIcon width={18} height={18} /></span>
        </button>
      ) : (
        <PassportConnect />
      )}
      </div>
      <SideSummary
        title={t("layout.summary")}
        rows={[
          { label: t("send.amount"), value: amount && amount > 0n ? `${formatMusd(amount)} MUSD${naira ? ` · ${naira}` : ""}` : "—" },
          { label: t("send.to"), value: validTo ? shortAddr(to) : "—" },
          { label: t("send.note"), value: note.trim() || "—" },
        ]}
      />
    </main>
  );
}

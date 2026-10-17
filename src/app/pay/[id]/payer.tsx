"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PassportConnect } from "@/components/PassportConnect";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { AddressRow } from "@/components/AddressRow";
import { ArrowIcon, BridgeScene, BtcMark, ShieldIcon } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { useFx } from "@/hooks/useFx";
import { usePosition } from "@/hooks/useMezo";
import { useI18n } from "@/i18n/I18nProvider";
import { erc20Abi } from "@/lib/abi";
import { CONTRACTS, MEZO_TESTNET } from "@/lib/mezo";
import { formatNaira, musdToNaira, parseAmount, txMessage, WAD } from "@/lib/format";
import { parsePayRequest, saveReceipt } from "@/lib/paylink";

export function Payer() {
  const { t } = useI18n();
  const fx = useFx();
  const router = useRouter();
  const params = useSearchParams();
  const request = parsePayRequest(params);
  const { address, isConnected, musd } = usePosition();
  const { chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: MEZO_TESTNET.chainId });
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const [phase, setPhase] = useState<"idle" | "wallet" | "chain">("idle");
  const [error, setError] = useState("");

  if (!request) {
    return <main className="screen stage"><h1>{t("pay.missing")}</h1></main>;
  }

  const amount = parseAmount(request.amount) ?? 0n;
  const naira = !fx.loading ? formatNaira(musdToNaira(amount, fx.ngnPerUsd)) : null;
  const whole = Number(amount / WAD);
  const frac = request.amount.includes(".") ? request.amount : String(whole);
  const mine = address?.toLowerCase() === request.to.toLowerCase();
  const busy = phase !== "idle";
  const short = musd != null && amount > musd;

  const pay = async () => {
    if (!address || !publicClient || mine || short) return;
    setError("");
    setPhase("wallet");
    try {
      if (chainId !== MEZO_TESTNET.chainId) await switchChainAsync({ chainId: MEZO_TESTNET.chainId });
      const hash = await writeContractAsync({
        address: CONTRACTS.MUSD,
        abi: erc20Abi,
        functionName: "transfer",
        args: [request.to as `0x${string}`, amount],
        chainId: MEZO_TESTNET.chainId,
      });
      setPhase("chain");
      saveReceipt(hash, { amount: request.amount, to: request.to, name: request.name, note: request.note });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error(t("receipt.failed"));
      router.push(`/receipt/${hash}`);
    } catch (err) {
      setError(txMessage(err, t("common.closed")));
      setPhase("idle");
    }
  };

  return (
    <main className="screen stage">
      <section className="payer-hero">
        <div className="portrait" aria-hidden="true">
          <BridgeScene />
          <BtcMark size={54} />
        </div>
        <h1>
          {request.name ? t("pay.requesting", { name: request.name }) : t("pay.requestingAnon")}
          <em>{frac} MUSD</em>
        </h1>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <div className="amount-panel">
          <span className="bubble-lg">$</span>
          <div style={{ flex: 1 }}>
            <strong>{frac} MUSD</strong>
            <div className="caption">{naira ? `(≈ ${naira})` : ""}</div>
          </div>
          <RateLine />
        </div>
        <div style={{ height: 12 }} />
        <AddressRow address={request.to} />
        {request.note ? <p className="note" style={{ marginTop: 10 }}>{t("pay.note")}: {request.note}</p> : null}
      </section>

      <p className="warn"><ShieldIcon width={18} height={18} /> {t("pay.check")}</p>
      {mine ? <p className="note" style={{ marginTop: 8 }}>{t("pay.yours")}</p> : null}
      {short ? <p className="error" style={{ marginTop: 8 }}>{t("send.funds")}</p> : null}
      {error ? <p className="error" style={{ marginTop: 8 }}>{error}</p> : null}

      <div style={{ marginTop: 12 }}>
        {isConnected ? (
          <button className="btn" type="button" disabled={mine || short || busy || amount <= 0n} onClick={pay}>
            <span />
            <span>{busy ? t("borrow.pending") : t("pay.now")}</span>
            <span className="end"><ArrowIcon width={18} height={18} /></span>
          </button>
        ) : (
          <PassportConnect end={<span className="end"><ArrowIcon width={18} height={18} /></span>} />
        )}
      </div>
    </main>
  );
}

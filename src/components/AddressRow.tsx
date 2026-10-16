"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { shortAddr } from "@/lib/mezo";
import { CopyIcon, WalletIcon } from "./Illustrations";

export function AddressRow({ address }: { address: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="addr">
      <span className="addr-badge" aria-hidden="true">
        <WalletIcon width={18} height={18} />
      </span>
      <span className="mono">{shortAddr(address)}</span>
      <button type="button" className="copy-pill" onClick={copy}>
        <CopyIcon width={14} height={14} />
        {copied ? t("common.copied") : t("common.copy")}
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useI18n } from "@/i18n/I18nProvider";
import { shortAddr } from "@/lib/mezo";
import { LanguageToggle } from "./LanguageToggle";
import { WalletIcon } from "./Illustrations";

export function Header() {
  const { t } = useI18n();
  return (
    <header className="header">
      <Link href="/" className="logo" aria-label="kudi">
        kud<span className="logo-i">i</span>
      </Link>
      <div className="cluster">
        <LanguageToggle />
        <span className="testnet"><i />{t("app.testnet")}</span>
        <ConnectButton.Custom>
          {({ account, openAccountModal, openConnectModal, mounted }) => {
            if (!mounted) return <span className="wallet-chip" aria-hidden="true" />;
            const label = account ? shortAddr(account.address) : t("account.connect");
            return (
              <button
                type="button"
                className="wallet-chip"
                onClick={account ? openAccountModal : openConnectModal}
                aria-label={label}
              >
                <WalletIcon width={16} height={16} />
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}

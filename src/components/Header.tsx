"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useReconnectPending } from "@/hooks/useReconnectPending";
import { useI18n } from "@/i18n/I18nProvider";
import { shortAddr } from "@/lib/mezo";
import { LanguageToggle } from "./LanguageToggle";
import { WalletIcon } from "./Illustrations";
import { InstallLink } from "./InstallCard";

export function Header() {
  const { t } = useI18n();
  const reconnecting = useReconnectPending();
  return (
    <header className="header">
      <Link href="/" className="logo" aria-label="kudi">
        kud<span className="logo-i">i</span>
      </Link>
      <div className="cluster">
        <InstallLink />
        <LanguageToggle />
        <span className="testnet"><i />{t("app.testnet")}</span>
        <ConnectButton.Custom>
          {({ account, openAccountModal, openConnectModal, mounted }) => {
            if (!mounted && !reconnecting) return <span className="wallet-chip" aria-hidden="true" />;
            const label = reconnecting ? t("wallet.reconnecting") : account ? shortAddr(account.address) : t("account.connect");
            return (
              <button
                type="button"
                className="wallet-chip"
                disabled={reconnecting}
                onClick={account && !reconnecting ? openAccountModal : openConnectModal}
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

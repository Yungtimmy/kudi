"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useReconnectPending } from "@/hooks/useReconnectPending";
import { useI18n } from "@/i18n/I18nProvider";
import { parseViewAddress, shortAddr, viewAddr } from "@/lib/mezo";
import { LanguageToggle } from "./LanguageToggle";
import { HomeIcon, LinkIcon, SendIcon, SwapIcon, WalletIcon } from "./Illustrations";

const items = [
  { href: "/home", key: "nav.home", icon: HomeIcon, match: (path: string) => path === "/home" },
  { href: "/borrow", key: "nav.borrow", icon: WalletIcon, match: (path: string) => path.startsWith("/borrow") },
  { href: "/swap", key: "nav.swap", icon: SwapIcon, match: (path: string) => path.startsWith("/swap") },
  { href: "/pay-link/new", key: "nav.pay", icon: LinkIcon, match: (path: string) => path.startsWith("/pay") },
  { href: "/send", key: "nav.send", icon: SendIcon, match: (path: string) => path.startsWith("/send") },
] as const;

export function NavLinks({ className }: { className: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  return (
    <nav className={className} aria-label={t("nav.menu")}>
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={item.match(pathname) ? "page" : undefined}>
          <item.icon width={20} height={20} />
          <span>{t(item.key)}</span>
        </Link>
      ))}
    </nav>
  );
}

export function TopNav() {
  return <NavLinks className="topnav" />;
}

export function Sidebar() {
  const { t } = useI18n();
  const reconnecting = useReconnectPending();
  const view = parseViewAddress(useSearchParams().get("address"));
  return (
    <aside className="sidebar">
      <Link href="/" className="logo" aria-label="kudi">
        kud<span className="logo-i">i</span>
      </Link>
      <NavLinks className="sidenav" />
      <div className="sidebar-foot">
        {view.address ? (
          <div className="sidebar-view" role="status">
            <span>{t("home.viewing", { address: viewAddr(view.address) })}</span>
            <Link href="/home">{t("home.exit")}</Link>
          </div>
        ) : null}
        <ConnectButton.Custom>
          {({ account, openAccountModal, openConnectModal, mounted }) => {
            const label = reconnecting ? t("wallet.reconnecting") : !mounted ? "" : account ? shortAddr(account.address) : t("account.connect");
            return (
              <button
                type="button"
                className="sidebar-wallet"
                disabled={!mounted || reconnecting}
                onClick={account && !reconnecting ? openAccountModal : openConnectModal}
              >
                <WalletIcon width={16} height={16} />
                <span>{label}</span>
              </button>
            );
          }}
        </ConnectButton.Custom>
        <div className="sidebar-meta">
          <LanguageToggle />
          <span className="testnet"><i />{t("app.testnet")}</span>
        </div>
      </div>
    </aside>
  );
}

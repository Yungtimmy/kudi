"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStorage, useConfig, WagmiProvider } from "wagmi";
import { getConfig, mezoTestnet } from "@mezo-org/passport";
import { useEffect, useState, type ReactNode } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { allowSilentBitcoinReconnect, reconnectLastWallet } from "@/lib/restoreWallet";

// The app shell is client-only, so there is no server HTML to seed from a cookie.
// ssr: true still matters: wagmi waits to rehydrate this localStorage before reconnect,
// which is how recentConnectorId and the last accounts survive a reload.
const storage = createStorage({
  storage: typeof window === "undefined" ? undefined : window.localStorage,
});
const config = getConfig({
  appName: "Kudi",
  mezoNetwork: "testnet",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "kudi-dev",
  storage,
  ssr: true,
});
allowSilentBitcoinReconnect(config);

function RestoreLastWallet() {
  const wagmiConfig = useConfig();
  useEffect(() => {
    void reconnectLastWallet(wagmiConfig);
  }, [wagmiConfig]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config} reconnectOnMount>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider initialChain={mezoTestnet} theme={lightTheme({ accentColor: "#0E7C4A", accentColorForeground: "#fff", borderRadius: "large" })}>
          <I18nProvider>
            <RestoreLastWallet />
            {children}
          </I18nProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

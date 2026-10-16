"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { getConfig, mezoTestnet } from "@mezo-org/passport";
import { useState, type ReactNode } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
const config = getConfig({ appName: "Kudi", mezoNetwork: "testnet", walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "kudi-dev" });
export function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (<WagmiProvider config={config}><QueryClientProvider client={qc}>
    <RainbowKitProvider initialChain={mezoTestnet} theme={lightTheme({ accentColor: "#0E7C4A", accentColorForeground: "#fff", borderRadius: "large" })}><I18nProvider>{children}</I18nProvider></RainbowKitProvider>
  </QueryClientProvider></WagmiProvider>);
}

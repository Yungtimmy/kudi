"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
// Wallet libs touch `document` on import, so load the provider tree in the browser only.
const Shell = dynamic(() => import("./AppShell").then((m) => m.AppShell), { ssr: false });
export function ClientRoot({ children }: { children: ReactNode }) { return <Shell>{children}</Shell>; }

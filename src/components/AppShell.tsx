"use client";
import type { ReactNode } from "react";
import { Providers } from "./Providers";
import { Header } from "./Header";
import { PwaRegister } from "./PwaRegister";
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="app">
        <PwaRegister />
        <Header />
        {children}
      </div>
    </Providers>
  );
}

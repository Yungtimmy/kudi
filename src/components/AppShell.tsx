"use client";
import { Suspense, type ReactNode } from "react";
import { Providers } from "./Providers";
import { Header } from "./Header";
import { PwaRegister } from "./PwaRegister";
import { Sidebar, TopNav } from "./SideNav";
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <div className="app">
        <PwaRegister />
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
        <div className="main-col">
          <Header />
          <TopNav />
          {children}
        </div>
      </div>
    </Providers>
  );
}

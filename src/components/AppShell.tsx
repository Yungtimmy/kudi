"use client";
import type { ReactNode } from "react";
import { Providers } from "./Providers";
import { Header } from "./Header";
export function AppShell({ children }: { children: ReactNode }) { return <Providers><Header />{children}</Providers>; }

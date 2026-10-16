import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ClientRoot } from "@/components/ClientRoot";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700"], variable: "--font-bricolage" });
export const metadata: Metadata = { title: "Kudi", description: "Bitcoin-backed MUSD for Nigerians on Mezo", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#0E7C4A", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className={`${inter.variable} ${bricolage.variable}`}><body><ClientRoot>{children}</ClientRoot></body></html>);
}

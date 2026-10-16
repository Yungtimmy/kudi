"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "./en.json";
import pcm from "./pcm.json";
export type Locale = "en" | "pcm";
const dicts: Record<Locale, Record<string, string>> = { en, pcm };
type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (k: string, v?: Record<string, string>) => string };
const I18nCtx = createContext<Ctx | null>(null);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en"); // English is the default
  useEffect(() => { const s = localStorage.getItem("kudi.locale"); if (s === "pcm" || s === "en") setLocaleState(s); }, []);
  const setLocale = (l: Locale) => { setLocaleState(l); localStorage.setItem("kudi.locale", l); };
  const t = (k: string, v?: Record<string, string>) => {
    let s = dicts[locale][k] ?? dicts.en[k] ?? k;
    if (v) for (const [a, b] of Object.entries(v)) s = s.replace(`{${a}}`, b);
    return s;
  };
  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>;
}
export function useI18n() { const c = useContext(I18nCtx); if (!c) throw new Error("useI18n outside I18nProvider"); return c; }

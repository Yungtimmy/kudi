"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "./en.json";
import pcm from "./pcm.json";

export type Locale = "en" | "pcm";
const dicts: Record<Locale, Record<string, string>> = { en, pcm };
type Vars = Record<string, string | number>;
type Ctx = { locale: Locale; setLocale: (l: Locale) => void; t: (k: string, v?: Vars) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    const saved = localStorage.getItem("kudi.locale");
    if (saved === "pcm" || saved === "en") setLocaleState(saved);
  }, []);
  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("kudi.locale", next);
  };
  const t = (k: string, v?: Vars) => {
    const english = dicts.en[k];
    const pidgin = dicts.pcm[k];
    let s: string;
    if (locale === "pcm") {
      if (pidgin == null) s = `[untranslated] ${english ?? k}`;
      else s = pidgin;
    } else {
      s = english ?? k;
    }
    if (v) {
      for (const [name, value] of Object.entries(v)) s = s.replaceAll(`{${name}}`, String(value));
    }
    return s;
  };
  return <I18nCtx.Provider value={{ locale, setLocale, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n outside I18nProvider");
  return ctx;
}

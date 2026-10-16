"use client";
import { useI18n } from "@/i18n/I18nProvider";
export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (<div className="toggle" role="group" aria-label="Language">
    <button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
    <button aria-pressed={locale === "pcm"} onClick={() => setLocale("pcm")}>Pidgin</button>
  </div>);
}

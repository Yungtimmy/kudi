"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="lang" role="group" aria-label="Language">
      <button type="button" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
      <button type="button" aria-pressed={locale === "pcm"} onClick={() => setLocale("pcm")}>Pidgin</button>
    </div>
  );
}

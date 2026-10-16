"use client";
import { useI18n } from "@/i18n/I18nProvider";
export function Placeholder({ titleKey, screen }: { titleKey: string; screen: number }) {
  const { t } = useI18n();
  return (<main className="screen"><h1>{t(titleKey)}</h1>
    <div className="card"><p>{t("common.comingSoon")}</p><p className="caption">Design: kudi-screen-{screen}.png</p></div></main>);
}

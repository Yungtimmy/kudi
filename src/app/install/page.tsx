"use client";

import { useEffect, useState } from "react";
import { Adire, BtcMark, DownloadIcon, KIcon } from "@/components/Illustrations";
import { RateLine } from "@/components/RateLine";
import { useI18n } from "@/i18n/I18nProvider";

type InstallEvent = Event & { prompt: () => Promise<void> };

export default function InstallPage() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const sync = () => {
      const stored = window.__kudiInstall;
      if (stored && "prompt" in stored) setPrompt(stored as InstallEvent);
    };
    sync();
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onReady = () => sync();
    const onInstalled = () => setInstalled(true);
    window.addEventListener("kudi-install-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("kudi-install-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) {
      setOpened(true);
      return;
    }
    await prompt.prompt();
    setOpened(true);
  }

  return (
    <main className="screen">
      <Adire />
      <div className="install-stage">
        <div className="phone-frame">
          <KIcon size={86} />
        </div>
        <span className="float-btc"><BtcMark size={72} /></span>
        <div className="float-musd">
          <span className="caption">MUSD</span>
          <strong>₦</strong>
        </div>
      </div>
      <h1>{t("install.title")}</h1>
      <p className="note" style={{ marginBottom: 16 }}>{t("install.body")}</p>
      <button className="btn" type="button" onClick={install}>
        <span />
        <span>{t("install.action")}</span>
        <span className="end"><DownloadIcon width={18} height={18} /></span>
      </button>
      {installed ? <p className="ok" style={{ marginTop: 12 }}>{t("install.done")}</p> : null}
      {(ios || opened) && !installed ? (
        <p className="note" style={{ marginTop: 12 }}>{ios ? t("install.ios") : t("install.manual")}</p>
      ) : null}
      <RateLine tone="pill" />
    </main>
  );
}

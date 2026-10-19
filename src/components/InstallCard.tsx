"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };
const KEY = "kudi.installCard.dismissed";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

export function InstallCard() {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {}
    if (dismissed || isStandalone()) return;
    const sync = () => {
      const stored = window.__kudiInstall;
      if (stored && "prompt" in stored) {
        setPrompt(stored as InstallEvent);
        setHidden(false);
      }
    };
    if (isIosSafari()) {
      setIos(true);
      setHidden(false);
    } else sync();
    const onInstalled = () => setHidden(true);
    window.addEventListener("kudi-install-ready", sync);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("kudi-install-ready", sync);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setHidden(true);
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    window.__kudiInstall = undefined;
    setPrompt(null);
    setHidden(true);
  }

  if (hidden) return null;
  return (
    <div className="install-card" role="region" aria-label={t("install.card")}>
      <div className="install-card-text">
        <strong>{t("install.card")}</strong>
        {ios ? <span className="caption">{t("install.cardIos")}</span> : null}
      </div>
      {!ios ? (
        <button type="button" className="btn small" onClick={install}>
          {t("install.action")}
        </button>
      ) : null}
      <button type="button" className="install-card-x" onClick={dismiss} aria-label={t("install.dismiss")}>
        ×
      </button>
    </div>
  );
}

export function InstallLink() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!isStandalone()), []);
  if (!show) return null;
  return (
    <Link href="/install" className="install-link">
      {t("install.action")}
    </Link>
  );
}

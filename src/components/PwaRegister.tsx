"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __kudiInstall?: Event;
  }
}

export function PwaRegister() {
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      window.__kudiInstall = event;
      window.dispatchEvent(new Event("kudi-install-ready"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return null;
}

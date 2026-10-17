"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

export function hasRecentConnector() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem("wagmi.recentConnectorId");
  return Boolean(raw && raw !== "null" && raw !== "undefined");
}

/** True until the saved connector has either reconnected or given up. */
export function useReconnectPending() {
  const { status } = useAccount();
  const [remembered] = useState(hasRecentConnector);
  const sawAttempt = useRef(false);
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (status === "connecting" || status === "reconnecting") sawAttempt.current = true;
    if (status === "connected") setGaveUp(false);
    else if (sawAttempt.current && status === "disconnected") setGaveUp(true);
  }, [status]);
  if (!remembered || status === "connected" || gaveUp) return false;
  return true;
}

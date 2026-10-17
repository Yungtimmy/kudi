"use client";

import type { ReactNode } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useI18n } from "@/i18n/I18nProvider";
import { useReconnectPending } from "@/hooks/useReconnectPending";

export function PassportConnect({ icon, end }: { icon?: ReactNode; end?: ReactNode }) {
  const { t } = useI18n();
  const reconnecting = useReconnectPending();
  if (reconnecting) {
    return (
      <button className="btn" type="button" disabled>
        {icon ?? <span />}
        <span>{t("wallet.reconnecting")}</span>
        {end ?? <span />}
      </button>
    );
  }
  return (
    <ConnectButton.Custom>
      {({ openConnectModal, mounted }) => (
        <button className="btn" type="button" disabled={!mounted} onClick={openConnectModal}>
          {icon ?? <span />}
          <span>{t("landing.connect")}</span>
          {end ?? <span />}
        </button>
      )}
    </ConnectButton.Custom>
  );
}

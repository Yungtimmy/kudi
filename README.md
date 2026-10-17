# kudi

Mobile-first, non-custodial web app on **Mezo testnet** for MUSD (Mezo hackathon, Track 2: Access & Distribution). Users connect with **Mezo Passport** and sign in the browser. Naira amounts are display only.

## Run

```bash
cp .env.example .env.local   # add a WalletConnect project id
npm install
npm run dev
```

## What's here

- Next.js 14 App Router + TypeScript (Mezo Passport needs React 18)
- Wallet connect: `@mezo-org/passport` + RainbowKit + wagmi + viem, Mezo testnet (chain 31611)
- Screens: `/` connect, `/home`, `/borrow`, `/swap`, `/send`, `/pay-link/new`, `/pay/request`, `/receipt/[hash]`, `/install`
- Live reads: MUSD balance, BTC balance, `PriceFeed.fetchPrice`, trove collateral / debt / ICR, `TroveManager.getTCR` and `checkRecoveryMode`
- Naira: `GET /api/fx` reads CoinGecko's free public API (tether NGN/USD, no key), cached on the server for 60 seconds. If CoinGecko fails it falls back to open.er-api.com (daily), then to a fixed ₦1,600 per USD. Labelled `naira rate updated hh:mm WAT` with the feed's own update time
- Loan health: Safe ≥ 150%, Warning 120–150%, Danger < 120%. Recovery banner when TCR is under 150%
- Borrow and swap submit real testnet transactions (open/adjust trove, router swap). The UI shows a transaction only after the wallet returns a hash. Withdrawing collateral is marked TODO
- i18n: `src/i18n/en.json` (default) and `pcm.json` (Pidgin). A missing Pidgin string renders as `[untranslated] …`
- PWA manifest, icons, and a network-only service worker registered in production

## Deploy (Vercel)

Import the repo, framework Next.js, set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. No always-on server.

Design: https://canva.link/i1pt1xs2ewzurty · Spec: `docs/wave1-build-spec.md`

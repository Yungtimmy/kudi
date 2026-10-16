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
- Design tokens: `src/app/globals.css` (CSS vars) and `src/lib/tokens.ts` — from `docs/kudi-design-system.md`
- i18n: `src/i18n/en.json` (default) + `pcm.json` (Pidgin), EN | Pidgin toggle in the header
- Loan health: `src/lib/health.ts` — safe ≥150%, warning 120–<150%, danger <120%
- Testnet contracts: `src/lib/mezo.ts`
- Routes: `/` landing+connect, `/home`, `/borrow`, `/swap`, `/send`, `/pay-link/new`, `/pay/[id]`, `/receipt/[hash]`, `/install`
- PWA manifest (icons TODO), `vercel.json`

## Deploy (Vercel)
Import the repo in Vercel, framework Next.js, set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. No server needed.

Design: https://canva.link/i1pt1xs2ewzurty · Spec: `docs/wave1-build-spec.md`

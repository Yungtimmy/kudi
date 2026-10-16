# Kudi Wave 1 build spec (Oct 16-26, 2026)

Source: mezo-kudi-plan.md + kudi-design-system.md (locked Oct 13). Commits for the hack start Oct 16. Setup-only before then.

## Goal
Mobile-first, non-custodial web app on Mezo testnet for MUSD. Track 2 (Access & Distribution). Hosted on Vercel free (Next.js, no always-on server). Users connect with Mezo Passport and sign in the browser.

## Must ship by Oct 26
1. Landing + Connect (Mezo Passport, Testnet tag)
2. Home: balances, loan health card, quick actions (Borrow, Swap, Send, Pay link)
3. Borrow with live health preview
4. Swap BTC to MUSD
5. Create pay link (optional display name, note, WhatsApp + copy)
6. Payer view of pay link (shortened address + copy, "Check the address before you pay")
7. Send receipt with Mezo explorer link
8. Installable PWA prompt
9. Naira display next to every MUSD/BTC amount ("rate as of hh:mm", display only)
10. EN | Pidgin toggle (en.json + pcm.json from day one)
11. Submission pack: live Vercel URL, public repo, 6-8 slide deck, 2-min video, explorer tx links, Akindo form

## Out of Wave 1 (Wave 2)
Loan alerts, x402 paywalls, bill-split, AI copilot, Flutterwave sandbox on-ramp, usage dashboard.

## Stack
- Next.js App Router on Vercel
- viem, @mezo-org/passport, @mezo-org/chains
- Design tokens: kola-green #0E7C4A, harmattan-cream #FFF6E9, suya-orange #F28C28, lagos-indigo #23246B, palm #9BD17A, amber #F5B700, pepper-red #E2453C
- Fonts: Bricolage Grotesque (headings), Inter (body, tabular amounts)

## Testnet
- Chain ID 31611 | RPC https://rpc.test.mezo.org | Explorer https://explorer.test.mezo.org | Faucet https://faucet.test.mezo.org
- MUSD 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
- BorrowerOperations 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5
- TroveManager 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0
- PriceFeed 0x86bCF0841622a5dAC14A313a15f96A95421b9366
- HintHelpers 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6
- Swap router 0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9
- MUSD/BTC pool 0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9
- Loans: 1% fixed, 110% min collateral, 1,800 MUSD minimum debt (~0.024 test BTC)

## Loan health UI thresholds (confirm before build)
- Safe (palm): ratio >= 150%
- Warning (amber): 120% to <150%
- Danger (pepper-red): <120%
Always show collateral ratio and liquidation price in USD and naira.

## Day plan
- Oct 16-17: repo, Vercel, Passport connect, balances + BTC price
- Oct 18-19: loan health (TroveManager + PriceFeed), naira display
- Oct 20-21: pay + request links with explorer receipts
- Oct 22-23: borrow/adjust (HintHelpers) + BTC to MUSD swap
- Oct 24: polish, mobile UX, PWA, README
- Oct 25: video, deck, roadmap, 10-20 community testers on testnet
- Oct 26: submit early
- Oct 16 14:00 WAT: Akindo onboarding session

## Setup checklist (before Oct 16 commits)
- [ ] Discord https://discord.mezo.org (Developer role)
- [ ] Faucet claim + open a test loan by hand on https://testnet.mezo.org
- [ ] Kickoff watched (Oct 13)
- [ ] Wave 1 build spec written (this file)
- [ ] GitHub repo (none yet as of Oct 14 evening)
- [ ] Confirm KYB path for solo student; note Wave 1 deadline timezone (plan asks 10/26 11:00)

## Risks
Faucet may not fund the 1,800 MUSD minimum. Never hold user keys. MEZO price moves.

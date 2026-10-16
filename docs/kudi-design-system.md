# Kudi Design System (Round 1, locked Oct 13, 2026)

Reference: https://canva.link/i1pt1xs2ewzurty (the PNGs in kudi-screens.tar.gz are exported from this design)

## Principles
- Mobile first, light and warm. No dark crypto look.
- Plain English by default. Pidgin only appears when the user turns it on with the EN | Pidgin switch.
- Show naira next to every MUSD and BTC amount, with a "rate as of hh:mm" label. The naira figure is for display only.
- Non-custodial and honest: always show the shortened wallet address with a copy button wherever money moves.

## Colour tokens
| Token | Hex | Use |
|---|---|---|
| kola-green | #0E7C4A | Primary buttons, brand, links |
| harmattan-cream | #FFF6E9 | App background |
| suya-orange | #F28C28 | Bitcoin, accent, logo coin |
| lagos-indigo | #23246B | Main text, headings |
| palm (safe) | #9BD17A | Healthy loan, success |
| amber (warning) | #F5B700 | Loan getting close to its limit |
| pepper-red (danger) | #E2453C | Near liquidation, errors |
| white | #FFFFFF | Cards |

Text on kola-green and pepper-red is white. Text on palm, amber and cream is lagos-indigo.

## Typography
- Headings: Bricolage Grotesque, Bold (700). H1 28/34, H2 22/28, H3 18/24.
- Body: Inter Regular 16/24, labels Inter Medium 14/20, captions Inter 12/16.
- Amounts: Inter SemiBold with tabular figures (`font-variant-numeric: tabular-nums`). Big balance 36/40.

## Shape and spacing
- 4px spacing scale (4, 8, 12, 16, 24, 32).
- Screen padding 16px (side), cards 16px inside padding.
- Corner radius: cards 20px, buttons 14px, pills fully rounded.
- Soft shadow on cards only: 0 2px 8px rgba(35,36,107,0.08).
- Primary button: full width, 52px tall.
- Subtle Adire-style geometric pattern as an accent on the landing page and success screens only.

## Logo
- Lowercase "kudi" wordmark in Bricolage Grotesque Bold, lagos-indigo; the dot on the "i" is a suya-orange coin.
- App icon: kola-green rounded square, white "k", orange coin dot.

## Loan health rules (Mezo borrow)
- Minimum loan 1,800 MUSD, 1% fixed rate, 110% minimum collateral ratio.
- Health states: Safe (palm) when the ratio is 150% or higher, Warning (amber) from 120% to just under 150%, Danger (pepper-red) below 120%. These thresholds are a proposal; confirm them before the build.
- Always show the collateral ratio and the liquidation price in both USD and naira.

## Screens (round 1)
1. Landing and Connect with Mezo Passport (Testnet tag)
2. Home: balances, loan health card, quick actions (Borrow, Swap, Send, Pay link)
3. Borrow with a live health preview
4. Swap BTC to MUSD
5. Create pay link (optional display name, note, WhatsApp and copy)
6. Payer view of pay link (name, shortened address with copy, "Check the address before you pay")
7. Send receipt ("Payment sent", "View on Mezo explorer")
8. Install as app prompt

## Copy and language
- Keep every string in one translation file (en.json, pcm.json) from day one.
- Default locale is en. The toggle switches to pcm (Nigerian Pidgin).
- All figures in the mockups are example values.

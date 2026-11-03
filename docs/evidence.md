# Kudi evidence — Mezo testnet

**Track 2: Access & Distribution.** Kudi is the naira-facing way to borrow MUSD against Bitcoin. The borrow screen shows the live loan risk next to the naira amount: the Mezo oracle price, the collateral ratio, the max the contract will still issue, and whether redemptions are open.

Network: **Mezo testnet only** (chain 31611). RPC `https://rpc.test.mezo.org`. Explorer `https://explorer.test.mezo.org`. Live app: https://trykudi.vercel.app

This file does not use mainnet.

## Judge check in 60 seconds

| Step | What to do | Pass |
| --- | --- | --- |
| 1 | Open https://trykudi.vercel.app/borrow (no wallet needed for the read). | A **Loan risk** card shows a live Bitcoin price in dollars and naira, the ratio the loan would open at, the most MUSD that Bitcoin can back at the 110% line, and redemption **Open** with a **0.75%** fee. |
| 2 | On [PriceFeed](https://explorer.test.mezo.org/address/0x86bCF0841622a5dAC14A313a15f96A95421b9366) read `fetchPrice`. | The dollar price matches the card (it moves; compare within a minute). `oracle()` is `0x7b7c000000000000000000000000000000000015`. |
| 3 | Read `BorrowerOperations.redemptionRate` and `TroveManager.getTCR(price)`. | Fee is 0.75% (`7500000000000000`). Redemption is open while TCR stays at or above MCR (110%). At the snapshot below, TCR was about 280% and recovery mode was off. |
| 4 | Open the four explorer links in the table below. | Each link opens on `explorer.test.mezo.org` and the call is `openTrove`, `addColl`, `repayMUSD`, or `swapExactTokensForTokens`. |

## Integration Level-3 transactions

These four transactions were produced on 2026-11-03 on Mezo testnet (chain 31611) by `npm run prove:level3` with `KUDI_PROOF_SEND=1`. Signer: `0x10c809BF6cE3e3dE8d9830F89297FF02bEa5D12f`. The private key stayed in the environment and is not recorded here. Steps to repeat the calls in the Kudi UI are under [Produce the hashes in Kudi](#produce-the-hashes-in-kudi). A funded key can also run [`npm run prove:level3`](#optional-proof-script).

| Step | Contract | Call | Explorer |
| --- | --- | --- | --- |
| Open a loan | [BorrowerOperations](https://explorer.test.mezo.org/address/0xCdF7028ceAB81fA0C6971208e83fa7872994beE5) `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5` | `openTrove` | [0x61db82218156db129428eb352e972d5af29af0c22b40df5c9d7c28b58c55a911](https://explorer.test.mezo.org/tx/0x61db82218156db129428eb352e972d5af29af0c22b40df5c9d7c28b58c55a911) |
| Top up Bitcoin | same | `addColl` | [0xa09b639fef3f407db5d934d784a1a1264bd7115b63eaedbc756b4570334f6372](https://explorer.test.mezo.org/tx/0xa09b639fef3f407db5d934d784a1a1264bd7115b63eaedbc756b4570334f6372) |
| Repay MUSD | same | `repayMUSD` | [0x403a67e00104ac763bda9c62e2184005f58be746412b802e870f5e236b722faf](https://explorer.test.mezo.org/tx/0x403a67e00104ac763bda9c62e2184005f58be746412b802e870f5e236b722faf) |
| Mezo Pools swap | [SwapRouter](https://explorer.test.mezo.org/address/0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9) `0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9` via [PoolFactory](https://explorer.test.mezo.org/address/0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A) and pool `0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9` | `swapExactTokensForTokens` | [0x6de234978046b07f7e65ba10478fa548c247d97a7614e1e09364697ee877a063](https://explorer.test.mezo.org/tx/0x6de234978046b07f7e65ba10478fa548c247d97a7614e1e09364697ee877a063) |

Hints for the trove calls come from `HintHelpers.getApproxHint` (`0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6`) and `SortedTroves.findInsertPosition` (`0x722E4D24FD6Ff8b0AC679450F3D91294607268fA`). Trial count is `15 * sqrt(list size)`, not a flat 15. On a few hundred troves a short hint makes the contract walk the list and run out of gas.

## Produce the hashes in Kudi

Use Mezo Passport on testnet. Stay on chain 31611. Kudi never asks for a seed phrase.

1. Open https://trykudi.vercel.app and connect. If the Bitcoin balance is 0, Home shows **Get test BTC**, which opens https://faucet.test.mezo.org. Come back; Home rechecks the balance.
2. **openTrove.** Go to Borrow. The Loan risk card is the live read. Enter at least 1,800 MUSD (or the naira preset). Confirm borrow and sign. The green line links to the explorer. That hash is the openTrove row. The smallest loan is 1,800 MUSD plus a 0.1% fee and a 200 MUSD reserve, so the wallet needs enough test BTC for the deposit shown (about 0.05 BTC near a $78,000 oracle at a 200% ratio) and a little left for the network fee.
3. **addColl.** After the loan is open, Home shows **Add BTC** even when the loan is Safe. Enter a small amount of BTC and confirm. That call is `addColl`. The same call is used on Borrow → Add to your loan when you raise the Bitcoin field and leave extra MUSD at 0.
4. **repayMUSD.** On Home, choose **Repay**. If the button says **Approve MUSD**, sign that approval, then press **Repay** again. That call is `repayMUSD`. You can repay while the loan is Safe. The button will not repay the last 1,800 MUSD plus the 200 MUSD reserve; closing the whole loan is a different contract call and is not this step.
5. **Pools swap.** Open Swap. Enter a small BTC amount. Approve BTC if asked, then Swap. The quote is `SwapRouter.getAmountsOut` for BTC → MUSD through PoolFactory on the volatile MUSD/BTC pool. The swap reverts if you would receive less than 99.5% of the quote.

Borrowing more MUSD on an existing loan uses `adjustTrove`, and only up to the lower of two limits: the live 110% line at the oracle price, and the stored `maxBorrowingCapacity`. Adding Bitcoin raises the ratio. It does not raise that stored ceiling. The card says so when the ceiling is the tighter limit.

## Live reads (block 16,523,022)

`npm run prove:level3` on 2026-11-02, chain 31611, no key present:

| Read | Result |
| --- | --- |
| `PriceFeed.fetchPrice` | $78,005.19234 |
| `PriceFeed.oracle` | `0x7b7c000000000000000000000000000000000015` |
| `BorrowerOperations.redemptionRate` | 0.75% (`7500000000000000`) |
| `BorrowerOperations.borrowingRate` | 0.10% |
| `minNetDebt` / gas reserve | 1,800 MUSD / 200 MUSD |
| MCR / TCR / recovery | 110% / 280.14% / false (redemptions open) |
| Redemption head `getCurrentICR` | `0xbe65D538E887D09a73354172c4411335fC2cbDb6` at 110.83% |
| Same ratio from `coll * price / debt` | 110.83%, exact match, no pending rewards |
| Stored `getTroveMaxBorrowingCapacity` | 2,135.07 MUSD |
| Fresh `coll * price / 110%` | 2,118.27 MUSD (tighter than the stored ceiling on this trove, because the stored number does not follow the oracle) |
| `SwapRouter.getAmountsOut` 0.001 BTC | 78.6054 MUSD |

A later load of `/borrow` in the app showed the same oracle path at about $78,157, max borrow about 3,436 MUSD against the default 1,800 MUSD / 200% deposit, and the lowest loan still above 110% near 111%, with the preview loan at 200% not first in line.

`getCurrentICR` is what the loan card and the risk card show for an open loan. A local `collateral * price / debt` figure is only the fallback before that call returns, and it matched the contract when pending rewards were zero.

## Optional proof script

```bash
npm run prove:level3
```

The script hardcodes `https://rpc.test.mezo.org` and exits if the chain id is not 31611. It does not accept another RPC URL.

It always prints the reads above. It broadcasts `openTrove`, `addColl`, `repayMUSD`, and `swapExactTokensForTokens` only when both are set:

| Name | What it is |
| --- | --- |
| `KUDI_PROOF_PRIVATE_KEY` | 32-byte hex private key of a **Mezo testnet** wallet. Read from the environment only. Never printed. Do not commit it. |
| `KUDI_PROOF_SEND` | Must be `1` or the script does not broadcast. |

The four transactions in the table were broadcast on 2026-11-03 from `0x10c809BF6cE3e3dE8d9830F89297FF02bEa5D12f` on Mezo testnet. `KUDI_PROOF_PRIVATE_KEY` is read from the environment only, never printed, and not committed. Do not invent a key. To run the script again, fund a testnet wallet at https://faucet.test.mezo.org (a new 1,800 MUSD loan at 200% needs on the order of 0.06 test BTC at the price above, plus a little more for the top-up and the swap), export that key into the environment, and run the script with `KUDI_PROOF_SEND=1`.

## Contracts (testnet)

| Contract | Address |
| --- | --- |
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |
| BorrowerOperations | `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5` |
| TroveManager | `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0` |
| PriceFeed | `0x86bCF0841622a5dAC14A313a15f96A95421b9366` |
| HintHelpers | `0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6` |
| SortedTroves | `0x722E4D24FD6Ff8b0AC679450F3D91294607268fA` |
| BTC | `0x7b7C000000000000000000000000000000000000` |
| SwapRouter | `0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9` |
| PoolFactory | `0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A` |
| MUSD/BTC pool | `0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9` |

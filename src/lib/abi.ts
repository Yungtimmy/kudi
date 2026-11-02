import { parseAbi } from "viem";

/**
 * Call signatures copied from @mezo-org/musd-contracts@1.1.0
 * deployments/matsnet. scripts/check-musd-abi.mjs fails if the package drifts.
 * The router ABI is from the Mezo pools router at CONTRACTS.SwapRouter.
 */
export const priceFeedAbi = parseAbi([
  "function fetchPrice() view returns (uint256)",
  "function oracle() view returns (address)",
]);

export const troveManagerAbi = parseAbi([
  "function MCR() view returns (uint256)",
  "function CCR() view returns (uint256)",
  "function MUSD_GAS_COMPENSATION() view returns (uint256)",
  "function getTroveColl(address _borrower) view returns (uint256)",
  "function getTroveDebt(address _borrower) view returns (uint256)",
  "function getTroveStatus(address _borrower) view returns (uint8)",
  "function getCurrentICR(address _borrower, uint256 _price) view returns (uint256)",
  "function getTrovePrincipal(address _borrower) view returns (uint256)",
  "function getTroveMaxBorrowingCapacity(address _borrower) view returns (uint256)",
  "function getTCR(uint256 _price) view returns (uint256)",
  "function checkRecoveryMode(uint256 _price) view returns (bool)",
  "function getTroveInterestRate(address _borrower) view returns (uint16)",
]);

export const borrowerOpsAbi = parseAbi([
  "function minNetDebt() view returns (uint256)",
  "function borrowingRate() view returns (uint256)",
  "function getBorrowingFee(uint256 _debt) view returns (uint256)",
  "function openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint) payable",
  "function adjustTrove(uint256 _collWithdrawal, uint256 _debtChange, bool _isDebtIncrease, address _upperHint, address _lowerHint) payable",
  "function addColl(address _upperHint, address _lowerHint) payable",
  "function repayMUSD(uint256 _amount, address _upperHint, address _lowerHint)",
  "function redemptionRate() view returns (uint256)",
]);

export const hintHelpersAbi = parseAbi([
  "function getApproxHint(uint256 _CR, uint256 _numTrials, uint256 _inputRandomSeed) view returns (address hintAddress, uint256 diff, uint256 latestRandomSeed)",
]);

export const sortedTrovesAbi = parseAbi([
  "function findInsertPosition(uint256 _NICR, address _prevId, address _nextId) view returns (address, address)",
  "function getSize() view returns (uint256)",
  "function getLast() view returns (address)",
  "function getPrev(address _id) view returns (address)",
  "function getNext(address _id) view returns (address)",
]);

export const interestRateAbi = parseAbi([
  "function interestRate() view returns (uint16)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const routerAbi = parseAbi([
  "function getAmountsOut(uint256 amountIn, (address from, address to, bool stable, address factory)[] routes) view returns (uint256[] amounts)",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, (address from, address to, bool stable, address factory)[] routes, address to, uint256 deadline) returns (uint256[] amounts)",
]);

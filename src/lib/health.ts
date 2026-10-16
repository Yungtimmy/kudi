// Loan health thresholds (confirmed): safe >=150%, warning 120% to <150%, danger <120%
export type Health = "safe" | "warning" | "danger";
export function loanHealth(collateralRatioPct: number): Health {
  if (collateralRatioPct >= 150) return "safe";
  if (collateralRatioPct >= 120) return "warning";
  return "danger";
}
export const healthColor: Record<Health, string> = { safe: "var(--palm)", warning: "var(--amber)", danger: "var(--pepper-red)" };

// Kudi design tokens (Round 1, locked Oct 13, 2026) — see kudi-design-system.md
export const colors = {
  kolaGreen: "#0E7C4A", harmattanCream: "#FFF6E9", suyaOrange: "#F28C28",
  lagosIndigo: "#23246B", palm: "#9BD17A", amber: "#F5B700", pepperRed: "#E2453C", white: "#FFFFFF",
} as const;
export const space = [4, 8, 12, 16, 24, 32] as const;
export const radius = { card: 20, button: 14, pill: 9999 } as const;
export const shadowCard = "0 2px 8px rgba(35,36,107,0.08)";

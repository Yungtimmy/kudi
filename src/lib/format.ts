export const WAD = 10n ** 18n;

export function formatGrouped(value: bigint): string {
  const neg = value < 0n;
  const digits = (neg ? -value : value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return neg ? `-${digits}` : digits;
}

function roundWad(wad: bigint, frac: number): bigint {
  if (frac >= 18) return wad;
  const unit = 10n ** BigInt(18 - frac);
  const neg = wad < 0n;
  const v = neg ? -wad : wad;
  const rounded = ((v + unit / 2n) / unit) * unit;
  return neg ? -rounded : rounded;
}

/** Fixed-point 18-decimal amount. `frac` is decimal places. */
export function formatToken(wad: bigint, frac: number, trim = false): string {
  const rounded = roundWad(wad, frac);
  const neg = rounded < 0n;
  const v = neg ? -rounded : rounded;
  const whole = v / WAD;
  let digits = (v % WAD).toString().padStart(18, "0").slice(0, frac);
  if (trim) digits = digits.replace(/0+$/, "");
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = digits ? `${wholeStr}.${digits}` : wholeStr;
  return neg ? `-${body}` : body;
}

export function formatMusd(wad: bigint, frac = 2): string {
  return formatToken(wad, frac, false);
}

export function formatBtc(wad: bigint): string {
  const trimmed = formatToken(wad, 6, true);
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length >= 3) return `${whole}.${frac}`;
  return `${whole}.${frac.padEnd(3, "0")}`;
}

export function formatUsd(wad: bigint): string {
  const abs = wad < 0n ? -wad : wad;
  const frac = abs >= 1000n * WAD ? 0 : 2;
  return `$${formatToken(abs, frac, false)}`;
}

export function formatNaira(naira: bigint): string {
  return `₦${formatGrouped(naira)}`;
}

/** 1 MUSD is treated as 1 USD for the display-only naira figure. */
export function musdToNaira(musdWad: bigint, ngnPerUsd: number): bigint {
  const rate = BigInt(Math.round(ngnPerUsd * 1000));
  return (musdWad * rate) / (WAD * 1000n);
}

export function btcToNaira(btcWad: bigint, priceWad: bigint, ngnPerUsd: number): bigint {
  return musdToNaira((btcWad * priceWad) / WAD, ngnPerUsd);
}

/** Whole naira to MUSD wad. Inverse of musdToNaira at the same rounded rate. */
export function nairaToMusd(naira: bigint, ngnPerUsd: number): bigint {
  if (!(ngnPerUsd > 0)) return 0n;
  const rate = BigInt(Math.round(ngnPerUsd * 1000));
  if (rate <= 0n) return 0n;
  return (naira * WAD * 1000n) / rate;
}

export function parseAmount(input: string): bigint | null {
  const s = input.trim();
  if (!s) return 0n;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  if (frac.length > 18) return null;
  return BigInt(whole) * WAD + BigInt(frac.padEnd(18, "0"));
}

export function wadToWhole(wad: bigint): number {
  return Number(wad / WAD);
}

export function wholeToWad(whole: number): bigint {
  if (!Number.isFinite(whole) || whole <= 0) return 0n;
  return BigInt(Math.floor(whole)) * WAD;
}

/** Clock time as hh:mm in the viewer’s local zone. */
export function formatHm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** Clock time as hh:mm in Africa/Lagos, where the naira label is read. */
export function formatHmLagos(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "--";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "--";
  return `${hour}:${minute}`;
}

export function formatWhen(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const h24 = d.getHours();
  const h12 = h24 % 12 || 12;
  const min = d.getMinutes().toString().padStart(2, "0");
  const ampm = h24 < 12 ? "AM" : "PM";
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${h12}:${min} ${ampm}`;
}

export function txMessage(error: unknown, closed: string): string {
  const raw =
    error && typeof error === "object" && "shortMessage" in error
      ? String((error as { shortMessage?: string }).shortMessage)
      : error instanceof Error
        ? error.message
        : "Transaction failed";
  if (/user rejected|user denied|rejected the request/i.test(raw)) return closed;
  return raw.length > 220 ? `${raw.slice(0, 220)}…` : raw;
}

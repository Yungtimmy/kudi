export type PayRequest = {
  to: string;
  amount: string;
  name: string;
  note: string;
};

export function parsePayRequest(params: URLSearchParams): PayRequest | null {
  const to = params.get("to") ?? "";
  const amount = params.get("amount") ?? "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return null;
  if (!/^\d+(\.\d{1,6})?$/.test(amount) || Number(amount) <= 0) return null;
  return {
    to,
    amount,
    name: (params.get("name") ?? "").slice(0, 42),
    note: (params.get("note") ?? "").slice(0, 160),
  };
}

export function payUrl(origin: string, req: PayRequest): string {
  const q = new URLSearchParams();
  q.set("to", req.to);
  q.set("amount", req.amount);
  if (req.name.trim()) q.set("name", req.name.trim());
  if (req.note.trim()) q.set("note", req.note.trim());
  return `${origin}/pay/request?${q.toString()}`;
}

export type ReceiptMeta = {
  amount: string;
  to: string;
  name?: string;
  note?: string;
};

export function saveReceipt(hash: string, meta: ReceiptMeta) {
  try {
    sessionStorage.setItem(`kudi.receipt.${hash}`, JSON.stringify(meta));
  } catch {
    /* private mode */
  }
}

export function loadReceipt(hash: string): ReceiptMeta | null {
  try {
    const raw = sessionStorage.getItem(`kudi.receipt.${hash}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReceiptMeta;
    if (!parsed || typeof parsed.amount !== "string" || typeof parsed.to !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

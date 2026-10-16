import { Suspense } from "react";
import { Payer } from "./payer";

export default function PayPage() {
  return (
    <Suspense fallback={<main className="screen"><p className="caption">…</p></main>}>
      <Payer />
    </Suspense>
  );
}

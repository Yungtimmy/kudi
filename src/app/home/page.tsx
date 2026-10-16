import { Suspense } from "react";
import { HomeScreen } from "./screen";

export default function Home() {
  return (
    <Suspense fallback={<main className="screen"><p className="caption">…</p></main>}>
      <HomeScreen />
    </Suspense>
  );
}

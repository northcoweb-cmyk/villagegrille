import { useEffect, useState } from "react";

export interface OrderConfig {
  /** "loading" until /api/config answers; "none" also covers a missing or broken server */
  mode: "loading" | "square" | "email" | "none";
  squareAppId: string | null;
  squareLocationId: string | null;
  squareEnv: "sandbox" | "production";
  delivery: boolean;
}

const INITIAL: OrderConfig = { mode: "loading", squareAppId: null, squareLocationId: null, squareEnv: "sandbox", delivery: false };
let cache: OrderConfig | null = null;
let pending: Promise<OrderConfig> | null = null;

function load(): Promise<OrderConfig> {
  pending ??= fetch("/api/config")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((c): OrderConfig => ({ ...INITIAL, ...c }))
    .catch((): OrderConfig => ({ ...INITIAL, mode: "none" }))
    .then((c) => (cache = c));
  return pending;
}

export function useOrderConfig(): OrderConfig {
  const [cfg, setCfg] = useState<OrderConfig>(cache ?? INITIAL);
  useEffect(() => {
    if (!cache) load().then(setCfg);
  }, []);
  return cfg;
}

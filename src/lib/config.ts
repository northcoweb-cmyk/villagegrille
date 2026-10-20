import { useEffect, useState } from "react";

export interface OrderConfig {
  /** "link" (default): ordering happens on the restaurant's existing ordering page */
  mode: "link" | "square" | "email";
  squareAppId: string | null;
  squareLocationId: string | null;
  squareEnv: "sandbox" | "production";
  delivery: boolean;
}

const INITIAL: OrderConfig = { mode: "link", squareAppId: null, squareLocationId: null, squareEnv: "sandbox", delivery: true };
let cache: OrderConfig | null = null;
let pending: Promise<OrderConfig> | null = null;

function load(): Promise<OrderConfig> {
  pending ??= fetch("/api/config")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((c): OrderConfig => ({ ...INITIAL, ...c }))
    .catch((): OrderConfig => INITIAL)
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

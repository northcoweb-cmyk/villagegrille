import { useEffect, useState } from "react";

export interface OrderConfig {
  /** "demo": fake orders (no payment, nothing sent to a POS) with a confirmation email. "square": real card payment + Square POS. */
  mode: "demo" | "square";
  squareAppId: string | null;
  squareLocationId: string | null;
  squareEnv: "sandbox" | "production";
  delivery: boolean;
}

const DEFAULT: OrderConfig = { mode: "demo", squareAppId: null, squareLocationId: null, squareEnv: "sandbox", delivery: false };
let cache: OrderConfig | null = null;
let pending: Promise<OrderConfig> | null = null;

function load(): Promise<OrderConfig> {
  pending ??= fetch("/api/config")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((c): OrderConfig => ({ ...DEFAULT, ...c, mode: c.mode === "square" ? "square" : "demo" }))
    .catch((): OrderConfig => DEFAULT)
    .then((c) => (cache = c));
  return pending;
}

export function useOrderConfig(): OrderConfig {
  const [cfg, setCfg] = useState<OrderConfig>(cache ?? DEFAULT);
  useEffect(() => {
    load().then(setCfg);
  }, []);
  return cfg;
}

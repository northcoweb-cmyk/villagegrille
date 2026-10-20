import { useEffect, useState } from "react";

export interface OrderConfig {
  /** "loading" until the site knows; "link" (default): ordering happens on the restaurant's existing ordering page */
  mode: "loading" | "link" | "square" | "demo";
  squareAppId: string | null;
  squareLocationId: string | null;
  squareEnv: "sandbox" | "production";
  delivery: boolean;
}

const INITIAL: OrderConfig = { mode: "loading", squareAppId: null, squareLocationId: null, squareEnv: "sandbox", delivery: true };
const KEY = "vg-config-v1";

/** last known config, so repeat visits start in the right mode with no flash */
function remembered(): OrderConfig | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    return c && (c.mode === "link" || c.mode === "square" || c.mode === "demo") ? { ...INITIAL, ...c } : null;
  } catch {
    return null;
  }
}
let cache: OrderConfig | null = remembered();

/** true when the site takes orders itself (cart + checkout) */
export const ordersHere = (mode: OrderConfig["mode"]) => mode === "square" || mode === "demo";
let pending: Promise<OrderConfig> | null = null;

function load(): Promise<OrderConfig> {
  pending ??= fetch("/api/config")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((c): OrderConfig => ({ ...INITIAL, ...c }))
    .catch((): OrderConfig => ({ ...INITIAL, mode: "link" }))
    .then((c) => {
      cache = c;
      try {
        localStorage.setItem(KEY, JSON.stringify(c));
      } catch {
        /* storage unavailable */
      }
      return c;
    });
  return pending;
}

export function useOrderConfig(): OrderConfig {
  const [cfg, setCfg] = useState<OrderConfig>(cache ?? INITIAL);
  useEffect(() => {
    load().then(setCfg); // always refresh in the background
  }, []);
  return cfg;
}

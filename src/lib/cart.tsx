import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { MenuItem } from "@/data/menu";

export interface CartLine {
  item: MenuItem;
  qty: number;
  note?: string;
}

type Action =
  | { type: "add"; item: MenuItem }
  | { type: "inc"; id: string }
  | { type: "dec"; id: string }
  | { type: "note"; id: string; note: string }
  | { type: "clear" };

const KEY = "vg-cart-v1";
export const TAX_RATE = 0.06; // Maryland sales tax on prepared food

function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case "add": {
      const hit = state.find((l) => l.item.id === a.item.id);
      return hit
        ? state.map((l) => (l.item.id === a.item.id ? { ...l, qty: l.qty + 1 } : l))
        : [...state, { item: a.item, qty: 1 }];
    }
    case "inc":
      return state.map((l) => (l.item.id === a.id ? { ...l, qty: l.qty + 1 } : l));
    case "dec":
      return state
        .map((l) => (l.item.id === a.id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0);
    case "note":
      return state.map((l) => (l.item.id === a.id ? { ...l, note: a.note } : l));
    case "clear":
      return [];
  }
}

function load(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

interface CartCtx {
  lines: CartLine[];
  count: number;
  subtotal: number;
  tax: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  dispatch: React.Dispatch<Action>;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines]);

  const value = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      tax,
      total: subtotal + tax,
      open,
      setOpen,
      dispatch,
    };
  }, [lines, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

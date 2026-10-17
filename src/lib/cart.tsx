import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import type { MenuItem } from "@/data/menu";

export interface Customization {
  removed: string[];
  extras: string[];
  note: string;
}

export interface CartLine {
  key: string;
  item: MenuItem;
  qty: number;
  mods: Customization;
}

export const NO_MODS: Customization = { removed: [], extras: [], note: "" };

/** Same dish + same customizations = same line. */
export const lineKey = (id: string, m: Customization) =>
  [id, [...m.removed].sort().join(","), [...m.extras].sort().join(","), m.note.trim().toLowerCase()].join("|");

export const describeMods = (m: Customization) =>
  [...m.removed.map((r) => `No ${r.toLowerCase()}`), ...m.extras, ...(m.note.trim() ? [`“${m.note.trim()}”`] : [])].join(" · ");

type Action =
  | { type: "add"; item: MenuItem; mods?: Customization; qty?: number }
  | { type: "replace"; oldKey: string; item: MenuItem; mods: Customization; qty: number }
  | { type: "inc"; key: string }
  | { type: "dec"; key: string }
  | { type: "clear" };

const KEY = "vg-cart-v2";
export const TAX_RATE = 0.06; // Maryland sales tax on prepared food

function put(state: CartLine[], item: MenuItem, mods: Customization, qty: number): CartLine[] {
  const key = lineKey(item.id, mods);
  const hit = state.find((l) => l.key === key);
  return hit
    ? state.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
    : [...state, { key, item, qty, mods }];
}

function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case "add":
      return put(state, a.item, a.mods ?? NO_MODS, a.qty ?? 1);
    case "replace":
      return put(state.filter((l) => l.key !== a.oldKey), a.item, a.mods, a.qty);
    case "inc":
      return state.map((l) => (l.key === a.key ? { ...l, qty: l.qty + 1 } : l));
    case "dec":
      return state.map((l) => (l.key === a.key ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0);
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

interface Customizing {
  item: MenuItem;
  line?: CartLine;
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
  customizing: Customizing | null;
  openItem: (item: MenuItem, line?: CartLine) => void;
  closeItem: () => void;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);
  const [open, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState<Customizing | null>(null);
  const openItem = useCallback((item: MenuItem, line?: CartLine) => setCustomizing({ item, line }), []);
  const closeItem = useCallback(() => setCustomizing(null), []);

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
      customizing,
      openItem,
      closeItem,
    };
  }, [lines, open, customizing, openItem, closeItem]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

import type { CartLine } from "@/lib/cart";

export interface OrderDetails {
  name: string;
  phone: string;
  email: string;
  method: "pickup" | "delivery";
  address?: string;
  when: "asap" | string;
  notes?: string;
}

export interface OrderPayload {
  details: OrderDetails;
  lines: CartLine[];
  /** one-time Square card token (card mode only) */
  paymentToken?: string;
}

/** kind "payment": the card was declined (message is safe to show); "send": the order could not be placed. */
export class OrderError extends Error {
  constructor(public kind: "payment" | "send", message = "") {
    super(message);
  }
}

/** Places the order through /api/order (see api/order.ts). Throws OrderError unless the order really went through. */
export async function submitOrder({ details, lines, paymentToken }: OrderPayload): Promise<{ confirmation: string; paid: boolean }> {
  let res: Response;
  try {
    res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        details,
        paymentToken,
        lines: lines.map((l) => ({ id: l.item.id, qty: l.qty, removed: l.mods.removed, extras: l.mods.extras, note: l.mods.note })),
      }),
    });
  } catch {
    throw new OrderError("send");
  }
  const data = await res.json().catch(() => null);
  if (res.status === 402 && data?.message) throw new OrderError("payment", data.message);
  if (!res.ok || !data?.confirmation) throw new OrderError("send");
  return { confirmation: data.confirmation, paid: !!data.paid };
}

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
}

export class OrderError extends Error {}

/**
 * Sends the order to the restaurant through /api/order (see api/order.ts), which emails it.
 * Throws OrderError if it could not be delivered. The caller must NOT tell the guest the order went
 * through in that case; it should keep the cart and ask them to call.
 */
export async function submitOrder({ details, lines }: OrderPayload): Promise<{ confirmation: string }> {
  let res: Response;
  try {
    res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        details,
        lines: lines.map((l) => ({
          id: l.item.id,
          qty: l.qty,
          removed: l.mods.removed,
          extras: l.mods.extras,
          note: l.mods.note,
        })),
      }),
    });
  } catch {
    throw new OrderError("network");
  }
  if (!res.ok) throw new OrderError(String(res.status));
  const data = await res.json().catch(() => null);
  if (!data?.confirmation) throw new OrderError("bad_response");
  return { confirmation: data.confirmation };
}

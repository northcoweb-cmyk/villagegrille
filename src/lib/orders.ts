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
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Order submission seam.
 *
 * Right now this records the order locally and returns a confirmation number so the whole
 * checkout flow works end to end. To go live, replace the body with a POST to the
 * restaurant's order endpoint (and a payment step such as Stripe Checkout). The rest of
 * the UI only depends on this function's signature.
 */
export async function submitOrder(order: OrderPayload): Promise<{ confirmation: string }> {
  await new Promise((r) => setTimeout(r, 700));
  const confirmation = "VG-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  try {
    const prev = JSON.parse(localStorage.getItem("vg-orders") || "[]");
    localStorage.setItem("vg-orders", JSON.stringify([...prev, { confirmation, ...order }]));
  } catch {
    /* storage unavailable */
  }
  return { confirmation };
}

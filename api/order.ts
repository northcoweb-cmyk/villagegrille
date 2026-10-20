import { SquareClient, SquareEnvironment, SquareError, type Square } from "square";
import { MENU, INFO } from "../src/data/menu.js";
import { renderReceipt } from "./_email.js";

/**
 * POST /api/order  (only active when ORDER_MODE=square)
 *
 *   1. create an Order in the restaurant's Square with a PICKUP fulfillment (this is the ticket the POS/KDS shows once paid)
 *   2. charge the card token against that order (amount = Square's own order total)
 *   3. if the card is declined, cancel the order so nothing reaches the kitchen
 *   4. email the CUSTOMER a receipt via Resend (the restaurant is never emailed; the Square ticket is their copy)
 *
 * Prices are always recomputed here from the menu; nothing price-related is trusted from the browser.
 */

interface Req {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

const TAX_RATE = 0.06;
const ITEMS = new Map(MENU.flatMap((c) => c.items.map((i) => [i.id, i] as const)));
const WHEN: Record<string, { label: string; mins: number }> = {
  asap: { label: "ASAP (about 30 min)", mins: 0 },
  "30": { label: "In 30 minutes", mins: 30 },
  "60": { label: "In 1 hour", mins: 60 },
  "90": { label: "In 90 minutes", mins: 90 },
};

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown) => (Array.isArray(v) ? v.map((x) => str(x, 60)).filter(Boolean).slice(0, 12) : []);
const e164 = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `+1${d}` : `+${d}`;
};
const clock = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(d);

/** What the kitchen sees on the line item. */
function lineNote(removed: string[], extras: string[], note: string) {
  return [removed.length ? `NO: ${removed.join(", ")}` : "", extras.length ? `ADD: ${extras.join(", ")}` : "", note ? `NOTE: ${note}` : ""]
    .filter(Boolean)
    .join(" | ");
}

async function emailCustomer(to: string, subject: string, html: string, text: string) {
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || `${INFO.name} <onboarding@resend.dev>`,
        to: [to],
        reply_to: process.env.ORDER_EMAIL_REPLY_TO || undefined,
        subject,
        html,
        text,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

function siteUrl(req: Req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "");
  return host ? `https://${host}` : "";
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const env = process.env;
  if (env.ORDER_MODE !== "square" || !(env.SQUARE_ACCESS_TOKEN && env.SQUARE_LOCATION_ID && env.SQUARE_APPLICATION_ID)) {
    return res.status(503).json({ error: "not_configured" });
  }

  const ip = String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const body = (req.body ?? {}) as { details?: Record<string, unknown>; lines?: unknown; paymentToken?: unknown };
  const d = body.details ?? {};
  const name = str(d.name, 80);
  const phone = str(d.phone, 24);
  const email = str(d.email, 120);
  const method = d.method === "delivery" ? "delivery" : "pickup";
  const address = str(d.address, 200);
  const when = WHEN[String(d.when)] ?? WHEN.asap;
  const notes = str(d.notes, 300);
  const paymentToken = str(body.paymentToken, 400);

  if (!name || phone.replace(/\D/g, "").length < 10 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "bad_details" });
  if (method === "delivery") {
    if (env.ENABLE_DELIVERY !== "true") return res.status(400).json({ error: "delivery_unavailable" });
    if (!address) return res.status(400).json({ error: "bad_details" });
  }
  if (!paymentToken) return res.status(400).json({ error: "payment_required" });
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 40) return res.status(400).json({ error: "bad_lines" });

  let subtotalC = 0;
  const lineItems: Square.OrderLineItem[] = [];
  const receiptItems: Parameters<typeof renderReceipt>[0]["items"] = [];
  for (const raw of body.lines as Record<string, unknown>[]) {
    const item = ITEMS.get(String(raw?.id));
    const qty = Math.floor(Number(raw?.qty));
    if (!item || !(qty >= 1 && qty <= 20)) return res.status(400).json({ error: "bad_lines" });
    const cents = Math.round(item.price * 100);
    subtotalC += cents * qty;
    const removed = strList(raw.removed);
    const extras = strList(raw.extras);
    const note = str(raw.note, 200);
    const kitchenNote = lineNote(removed, extras, note);
    lineItems.push({ name: item.name, quantity: String(qty), basePriceMoney: { amount: BigInt(cents), currency: "USD" }, note: kitchenNote || undefined });
    receiptItems.push({ qty, name: item.name, removed, extras, note, lineCents: cents * qty });
  }
  const taxC = Math.round(subtotalC * TAX_RATE);
  const confirmation = "VG-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  const client = new SquareClient({
    token: env.SQUARE_ACCESS_TOKEN,
    environment: env.SQUARE_ENV === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  });
  const locationId = env.SQUARE_LOCATION_ID!;
  const recipient = { displayName: name, phoneNumber: e164(phone), emailAddress: email };
  const fulfillmentNote = [method === "delivery" ? `** DELIVERY ORDER ** Deliver to: ${address}` : "", notes].filter(Boolean).join(" | ") || undefined;
  const readyDate = new Date(Date.now() + (when.mins || 30) * 60_000);

  let order: Square.Order | undefined;
  try {
    const created = await client.orders.create({
      idempotencyKey: `${confirmation}-order`,
      order: {
        locationId,
        referenceId: confirmation,
        ticketName: name.slice(0, 30),
        source: { name: "Village Grille Website" },
        lineItems,
        taxes: [{ uid: "md-sales-tax", name: "MD Sales Tax", percentage: "6", scope: "ORDER" }],
        // DELIVERY-type fulfillments are hidden from Square POS without a Square partnership, so both methods are PICKUP tickets
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: when.mins
              ? { scheduleType: "SCHEDULED", pickupAt: readyDate.toISOString(), prepTimeDuration: "PT20M", recipient, note: fulfillmentNote }
              : { scheduleType: "ASAP", prepTimeDuration: "PT30M", recipient, note: fulfillmentNote },
          },
        ],
      },
    });
    order = created.order;
  } catch {
    return res.status(502).json({ error: "order_failed" });
  }
  if (!order?.id || !order.totalMoney) return res.status(502).json({ error: "order_failed" });

  // the payment must equal Square's own total; refuse if it disagrees with what we showed the customer
  const totalC = Number(order.totalMoney.amount);
  const cancel = async () => {
    try {
      await client.orders.update({ orderId: order!.id!, idempotencyKey: `${confirmation}-cancel`, order: { locationId, version: order!.version, state: "CANCELED" } });
    } catch {
      /* an unpaid order is invisible to staff anyway */
    }
  };
  if (Math.abs(totalC - (subtotalC + taxC)) > 2) {
    await cancel();
    return res.status(502).json({ error: "total_mismatch" });
  }

  let paidWith: string | undefined;
  try {
    const pay = await client.payments.create({
      idempotencyKey: `${confirmation}-pay`,
      sourceId: paymentToken,
      amountMoney: order.totalMoney,
      orderId: order.id,
      locationId,
      buyerEmailAddress: email,
      referenceId: confirmation,
      autocomplete: true,
    });
    const status = pay.payment?.status;
    if (status === "FAILED" || status === "CANCELED") throw new Error("not_paid");
    const c = pay.payment?.cardDetails?.card;
    if (c?.last4) paidWith = `${(c.cardBrand ?? "Card").replace(/_/g, " ").toLowerCase().replace(/^\w/, (x) => x.toUpperCase())} ending ${c.last4}`;
  } catch (err) {
    await cancel();
    const declined = err instanceof SquareError ? (err.statusCode ?? 500) < 500 : true;
    return res.status(declined ? 402 : 502).json({
      error: "payment_failed",
      message: declined ? "Your card was declined. Please check the details or try another card." : "We couldn't process the payment. Please try again or call us.",
    });
  }

  // The order is paid and on the POS. The receipt is a courtesy: a failed email never fails the order.
  const base = siteUrl(req);
  const receipt = renderReceipt({
    confirmation,
    firstName: name.split(/\s+/)[0],
    name,
    phone,
    readyAt: clock(readyDate),
    whenLabel: when.label,
    method,
    deliveryAddress: address,
    items: receiptItems,
    subtotalC,
    taxC: totalC - subtotalC,
    totalC,
    paidWith: paidWith ?? "Card",
    notes: notes || undefined,
    logoUrl: `${base}/logo.png`,
    restaurant: { name: INFO.name, address: INFO.address, phone: INFO.phone, phoneHref: INFO.phoneHref, mapsUrl: INFO.mapsUrl, hours: INFO.hours },
  });
  const emailed = await emailCustomer(email, receipt.subject, receipt.html, receipt.text);

  return res.status(200).json({ confirmation, paid: true, emailed, total: totalC / 100 });
}

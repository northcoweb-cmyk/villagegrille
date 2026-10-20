import { SquareClient, SquareEnvironment, SquareError, type Square } from "square";
import { MENU, INFO } from "../src/data/menu.js";

/**
 * POST /api/order
 *
 * Square mode (SQUARE_ACCESS_TOKEN + SQUARE_LOCATION_ID + SQUARE_APPLICATION_ID):
 *   1. create an Order with a PICKUP fulfillment (this is the ticket the POS/KDS shows once it is paid)
 *   2. charge the card token against that order (amount = Square's own order total)
 *   3. if the card is declined, cancel the order so nothing reaches the kitchen
 *   4. email the restaurant (and the customer) a copy via Resend, if configured
 * Email mode (RESEND_API_KEY + ORDER_EMAIL_TO only): email the order, customer pays at pickup.
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
const usd = (cents: number | bigint) => `$${(Number(cents) / 100).toFixed(2)}`;
const e164 = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `+1${d}` : `+${d}`;
};

/** What the kitchen sees on the line item. */
function lineNote(removed: string[], extras: string[], note: string) {
  return [removed.length ? `NO: ${removed.join(", ")}` : "", extras.length ? `ADD: ${extras.join(", ")}` : "", note ? `NOTE: ${note}` : ""]
    .filter(Boolean)
    .join(" | ");
}

async function sendEmail(to: string[], subject: string, text: string, replyTo?: string) {
  const { RESEND_API_KEY } = process.env;
  if (!RESEND_API_KEY || !to.length) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || `${INFO.name} Orders <onboarding@resend.dev>`,
        to,
        reply_to: replyTo,
        subject,
        text,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const env = process.env;
  // must match api/config.ts: nothing here runs unless ORDER_MODE is set on purpose
  const squareOn = env.ORDER_MODE === "square" && !!(env.SQUARE_ACCESS_TOKEN && env.SQUARE_LOCATION_ID && env.SQUARE_APPLICATION_ID);
  const emailOn = env.ORDER_MODE === "email" && !!(env.RESEND_API_KEY && env.ORDER_EMAIL_TO);
  if (!squareOn && !emailOn) return res.status(503).json({ error: "not_configured" });

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
  if (squareOn && !paymentToken) return res.status(400).json({ error: "payment_required" });
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 40) return res.status(400).json({ error: "bad_lines" });

  let subtotalC = 0;
  const textLines: string[] = [];
  const lineItems: Square.OrderLineItem[] = [];
  for (const raw of body.lines as Record<string, unknown>[]) {
    const item = ITEMS.get(String(raw?.id));
    const qty = Math.floor(Number(raw?.qty));
    if (!item || !(qty >= 1 && qty <= 20)) return res.status(400).json({ error: "bad_lines" });
    const cents = Math.round(item.price * 100);
    subtotalC += cents * qty;
    const note = lineNote(strList(raw.removed), strList(raw.extras), str(raw.note, 200));
    lineItems.push({ name: item.name, quantity: String(qty), basePriceMoney: { amount: BigInt(cents), currency: "USD" }, note: note || undefined });
    textLines.push(`${qty} x ${item.name} - ${usd(cents * qty)}`);
    if (note) textLines.push(`     ${note}`);
  }
  const taxC = Math.round(subtotalC * TAX_RATE);
  let totalC = subtotalC + taxC;
  const confirmation = "VG-" + Math.random().toString(36).slice(2, 7).toUpperCase();
  let squareOrderId = "";
  let paid = false;

  if (squareOn) {
    const client = new SquareClient({
      token: env.SQUARE_ACCESS_TOKEN,
      environment: env.SQUARE_ENV === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
    const locationId = env.SQUARE_LOCATION_ID!;
    const recipient = { displayName: name, phoneNumber: e164(phone), emailAddress: email };
    const fulfillmentNote = [method === "delivery" ? `** DELIVERY ORDER ** Deliver to: ${address}` : "", notes].filter(Boolean).join(" | ") || undefined;

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
                ? {
                    scheduleType: "SCHEDULED",
                    pickupAt: new Date(Date.now() + when.mins * 60_000).toISOString(),
                    prepTimeDuration: "PT20M",
                    recipient,
                    note: fulfillmentNote,
                  }
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
    squareOrderId = order.id;

    // the payment must equal Square's own total; refuse if it disagrees with what we showed the customer
    totalC = Number(order.totalMoney.amount);
    const cancel = async () => {
      try {
        await client.orders.update({
          orderId: order!.id!,
          idempotencyKey: `${confirmation}-cancel`,
          order: { locationId, version: order!.version, state: "CANCELED" },
        });
      } catch {
        /* an unpaid order is invisible to staff anyway */
      }
    };
    if (Math.abs(totalC - (subtotalC + taxC)) > 2) {
      await cancel();
      return res.status(502).json({ error: "total_mismatch" });
    }

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
      paid = true;
    } catch (err) {
      await cancel();
      const declined = err instanceof SquareError ? (err.statusCode ?? 500) < 500 : true;
      return res.status(declined ? 402 : 502).json({
        error: "payment_failed",
        message: declined ? "Your card was declined. Please check the details or try another card." : "We couldn't process the payment. Please try again or call us.",
      });
    }
  }

  const header = [
    `NEW ONLINE ORDER ${confirmation}${squareOrderId ? `  (Square order ${squareOrderId})` : ""}`,
    `${method.toUpperCase()} - ${when.label}`,
    paid ? "PAID ONLINE - already on the Square POS as a ticket" : "NOT PAID - customer pays at pickup",
  ];
  const body2 = [
    "",
    `Name:  ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    ...(method === "delivery" ? [`Deliver to: ${address}`] : []),
    "",
    "ITEMS",
    ...textLines,
    "",
    `Subtotal: ${usd(subtotalC)}`,
    `Tax (6%): ${usd(totalC - subtotalC)}`,
    `TOTAL:    ${usd(totalC)}`,
    ...(notes ? ["", `Order notes: ${notes}`] : []),
  ];
  const restaurantTo = (env.ORDER_EMAIL_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const restaurantSent = await sendEmail(restaurantTo, `[${confirmation}] ${method} order - ${name} - ${usd(totalC)}`, [...header, ...body2].join("\n"), email);
  // customer receipt (best effort; in Resend test mode this only reaches the account owner)
  await sendEmail(
    [email],
    `Your ${INFO.name} order ${confirmation}`,
    [
      `Thanks, ${name.split(" ")[0]}! Your order ${confirmation} was received.`,
      `${method === "pickup" ? `Pick up at ${INFO.address}` : `Delivery to ${address}`} - ${when.label}`,
      paid ? "Paid online." : "You'll pay at pickup.",
      "",
      ...textLines,
      "",
      `Total: ${usd(totalC)}`,
      "",
      `Questions? Call ${INFO.phone}.`,
    ].join("\n")
  );

  // in email-only mode the email IS the order; if it did not go out, the order was not placed
  if (!squareOn && !restaurantSent) return res.status(502).json({ error: "send_failed" });
  return res.status(200).json({ confirmation, paid, total: Number(totalC) / 100 });
}

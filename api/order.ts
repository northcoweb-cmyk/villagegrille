import { MENU, INFO } from "../src/data/menu.js";

/**
 * POST /api/order  -> emails the order to the restaurant.
 *
 * Environment variables (set in the host's dashboard):
 *   RESEND_API_KEY      API key from resend.com
 *   ORDER_EMAIL_TO      where orders go (comma-separated for several)
 *   ORDER_EMAIL_FROM    optional sender, must be on a domain verified in Resend
 * Without them this returns 503 and the site tells the customer to call instead.
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
const WHEN: Record<string, string> = { asap: "ASAP (about 30 min)", "30": "In 30 minutes", "60": "In 1 hour", "90": "In 90 minutes" };

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
const money = (n: number) => `$${n.toFixed(2)}`;

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { RESEND_API_KEY, ORDER_EMAIL_TO } = process.env;
  if (!RESEND_API_KEY || !ORDER_EMAIL_TO) return res.status(503).json({ error: "not_configured" });

  const ip = String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  const body = (req.body ?? {}) as { details?: Record<string, unknown>; lines?: unknown };
  const d = body.details ?? {};
  const name = str(d.name, 80);
  const phone = str(d.phone, 24);
  const email = str(d.email, 120);
  const method = d.method === "delivery" ? "delivery" : "pickup";
  const address = str(d.address, 200);
  const when = WHEN[String(d.when)] ?? WHEN.asap;
  const notes = str(d.notes, 300);

  if (!name || phone.replace(/\D/g, "").length < 10 || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "bad_details" });
  if (method === "delivery" && !address) return res.status(400).json({ error: "bad_details" });
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 40) return res.status(400).json({ error: "bad_lines" });

  let subtotal = 0;
  const lines: string[] = [];
  for (const raw of body.lines as Record<string, unknown>[]) {
    const item = ITEMS.get(String(raw?.id));
    const qty = Math.floor(Number(raw?.qty));
    if (!item || !(qty >= 1 && qty <= 20)) return res.status(400).json({ error: "bad_lines" });
    subtotal += item.price * qty;
    lines.push(`${qty} x ${item.name} - ${money(item.price * qty)}`);
    const removed = strList(raw.removed);
    const extras = strList(raw.extras);
    const note = str(raw.note, 200);
    if (removed.length) lines.push(`     REMOVE: ${removed.join(", ")}`);
    if (extras.length) lines.push(`     EXTRAS/REQUESTS: ${extras.join(", ")}`);
    if (note) lines.push(`     NOTE: ${note}`);
  }
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax;
  const confirmation = "VG-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  const text = [
    `NEW ONLINE ORDER ${confirmation}`,
    `${method.toUpperCase()} - ${when}`,
    "",
    `Name:  ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    ...(method === "delivery" ? [`Deliver to: ${address}`] : []),
    "",
    "ITEMS",
    ...lines,
    "",
    `Subtotal: ${money(subtotal)}`,
    `Tax (6%): ${money(tax)}`,
    `TOTAL:    ${money(total)}`,
    "Payment:  due at pickup/delivery (not paid online)",
    ...(notes ? ["", `Order notes: ${notes}`] : []),
    "",
    `Sent from the ${INFO.name} website.`,
  ].join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_EMAIL_FROM || `${INFO.name} Orders <onboarding@resend.dev>`,
        to: ORDER_EMAIL_TO.split(",").map((s) => s.trim()).filter(Boolean),
        reply_to: email,
        subject: `[${confirmation}] ${method} order - ${name} - ${money(total)}`,
        text,
      }),
    });
    if (!r.ok) return res.status(502).json({ error: "send_failed" });
    return res.status(200).json({ confirmation });
  } catch {
    return res.status(502).json({ error: "send_failed" });
  }
}

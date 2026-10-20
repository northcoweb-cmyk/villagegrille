/**
 * Customer receipt email: table layout + inline styles so it renders in Gmail, Apple Mail and Outlook.
 * (Files starting with "_" in /api are helpers, not endpoints.)
 */

export interface ReceiptItem {
  qty: number;
  name: string;
  removed: string[];
  extras: string[];
  note: string;
  lineCents: number;
}

export interface Receipt {
  confirmation: string;
  firstName: string;
  name: string;
  phone: string;
  /** e.g. "6:45 PM" */
  readyAt: string;
  whenLabel: string;
  method: "pickup" | "delivery";
  deliveryAddress?: string;
  items: ReceiptItem[];
  subtotalC: number;
  taxC: number;
  totalC: number;
  /** e.g. "Visa ending 4242" */
  paidWith?: string;
  /** demo order: nothing was sent to the restaurant and no payment was taken */
  demo?: boolean;
  notes?: string;
  logoUrl: string;
  restaurant: { name: string; address: string; phone: string; phoneHref: string; mapsUrl: string; hours: [string, string][] };
}

const BRAND = "#870d13";
const INK = "#18181b";
const MUTED = "#71717a";
const LINE = "#e4e4e7";
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function itemRow(i: ReceiptItem) {
  const mods = [
    ...i.removed.map((r) => `No ${esc(r.toLowerCase())}`),
    ...i.extras.map((e) => esc(e)),
    ...(i.note ? [`&ldquo;${esc(i.note)}&rdquo;`] : []),
  ];
  return `
  <tr>
    <td width="44" valign="top" style="padding:14px 0 14px 0;border-bottom:1px solid ${LINE};">
      <div style="width:34px;height:34px;line-height:34px;border-radius:10px;background:#f7ecec;color:${BRAND};font-weight:800;font-size:14px;text-align:center;">${i.qty}&times;</div>
    </td>
    <td valign="top" style="padding:14px 12px 14px 0;border-bottom:1px solid ${LINE};">
      <div style="font-size:16px;font-weight:700;color:${INK};line-height:22px;">${esc(i.name)}</div>
      ${mods.length ? `<div style="margin-top:3px;font-size:13px;line-height:19px;color:${BRAND};">${mods.join(" &middot; ")}</div>` : ""}
    </td>
    <td valign="top" align="right" style="padding:14px 0;border-bottom:1px solid ${LINE};font-size:16px;font-weight:700;color:${INK};white-space:nowrap;">${usd(i.lineCents)}</td>
  </tr>`;
}

function totalRow(label: string, value: string, strong = false) {
  return `<tr>
    <td style="padding:${strong ? "12px" : "4px"} 0 ${strong ? "0" : "4px"};font-size:${strong ? "18px" : "14px"};font-weight:${strong ? "800" : "500"};color:${strong ? INK : MUTED};">${label}</td>
    <td align="right" style="padding:${strong ? "12px" : "4px"} 0 ${strong ? "0" : "4px"};font-size:${strong ? "20px" : "14px"};font-weight:${strong ? "800" : "600"};color:${strong ? BRAND : INK};">${value}</td>
  </tr>`;
}

export function renderReceipt(r: Receipt): { subject: string; html: string; text: string } {
  const where = r.method === "delivery" ? `Delivery to ${r.deliveryAddress ?? ""}` : r.restaurant.address;
  const subject = `Order confirmed: ${r.confirmation} · ${r.restaurant.name}`;
  const preheader = `Your order is in. Ready around ${r.readyAt}. Total ${usd(r.totalC)}.`;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4efee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4efee;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efee;">
<tr><td align="center" style="padding:28px 14px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;font-family:${FONT};">

    <!-- logo -->
    <tr><td align="center" bgcolor="#ffffff" style="background:#ffffff;border-radius:20px 20px 0 0;padding:26px 24px 18px;">
      <img src="${esc(r.logoUrl)}" width="132" alt="${esc(r.restaurant.name)}" style="display:block;border:0;outline:none;width:132px;height:auto;">
    </td></tr>

    <!-- hero -->
    <tr><td align="center" bgcolor="${BRAND}" style="background:${BRAND};padding:34px 28px 36px;">
      <div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#f3c9cc;text-transform:uppercase;">Order confirmed</div>
      <div style="margin-top:10px;font-size:30px;line-height:36px;font-weight:800;color:#ffffff;">Thanks, ${esc(r.firstName)}!</div>
      <div style="margin-top:6px;font-size:16px;line-height:24px;color:#fbe9ea;">We've got your order and the kitchen is on it.</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;"><tr>
        <td bgcolor="#ffffff" style="background:#ffffff;border-radius:999px;padding:9px 20px;font-size:15px;font-weight:800;letter-spacing:1px;color:${BRAND};">${esc(r.confirmation)}</td>
      </tr></table>
    </td></tr>

    <!-- ticket -->
    <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:30px 28px 8px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f6;border-radius:14px;">
        <tr>
          <td width="50%" valign="top" style="padding:16px 18px;">
            <div style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:${MUTED};text-transform:uppercase;">${r.method === "pickup" ? "Ready for pickup" : "Delivery"}</div>
            <div style="margin-top:4px;font-size:20px;font-weight:800;color:${INK};">${esc(r.readyAt)}</div>
            <div style="font-size:13px;color:${MUTED};">${esc(r.whenLabel)}</div>
          </td>
          <td width="50%" valign="top" style="padding:16px 18px;border-left:1px dashed #d9cfcf;">
            <div style="font-size:11px;letter-spacing:1.5px;font-weight:700;color:${MUTED};text-transform:uppercase;">${r.method === "pickup" ? "Pick up at" : "Deliver to"}</div>
            <div style="margin-top:4px;font-size:14px;line-height:20px;font-weight:600;color:${INK};">${esc(where)}</div>
          </td>
        </tr>
      </table>

      <div style="margin:28px 0 4px;font-size:12px;letter-spacing:2px;font-weight:800;color:${BRAND};text-transform:uppercase;">Your order</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${r.items.map(itemRow).join("")}
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        ${totalRow("Subtotal", usd(r.subtotalC))}
        ${totalRow("Tax (6%)", usd(r.taxC))}
        ${totalRow("Total", usd(r.totalC), true)}
      </table>
      ${r.demo ? `<div style="margin-top:14px;padding:11px 14px;background:#fff7e6;border-radius:10px;font-size:13px;font-weight:600;color:#8a5a00;">Demo order &middot; no payment was taken and nothing was sent to the restaurant.</div>` : r.paidWith ? `<div style="margin-top:14px;padding:11px 14px;background:#eef7f0;border-radius:10px;font-size:13px;font-weight:600;color:#1d6b35;">&#10003;&nbsp; Paid &middot; ${esc(r.paidWith)}</div>` : ""}
      ${r.notes ? `<div style="margin-top:14px;padding:11px 14px;background:#faf6f6;border-radius:10px;font-size:13px;color:${INK};"><b>Order notes:</b> ${esc(r.notes)}</div>` : ""}

      <!-- button -->
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:30px auto 18px;"><tr>
        <td bgcolor="${BRAND}" style="background:${BRAND};border-radius:999px;"><a href="${esc(r.restaurant.mapsUrl)}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${FONT};">Get directions</a></td>
      </tr></table>
    </td></tr>

    <!-- footer -->
    <tr><td bgcolor="#ffffff" align="center" style="background:#ffffff;border-radius:0 0 20px 20px;padding:6px 28px 30px;border-top:1px dashed #e6dede;">
      <div style="padding-top:22px;font-size:14px;line-height:22px;color:${MUTED};">
        Questions about your order? Call us at<br>
        <a href="${esc(r.restaurant.phoneHref)}" style="font-size:18px;font-weight:800;color:${BRAND};text-decoration:none;">${esc(r.restaurant.phone)}</a>
      </div>
      <div style="margin-top:16px;font-size:12px;line-height:19px;color:#a1a1aa;">
        Mon&ndash;Fri ${esc(r.restaurant.hours[0][1])} &nbsp;&middot;&nbsp; Sat&ndash;Sun ${esc(r.restaurant.hours[5][1])}
      </div>
    </td></tr>

    <tr><td align="center" style="padding:18px 10px 0;font-size:12px;line-height:18px;color:#a8a29e;">
      ${esc(r.restaurant.name)} &middot; ${esc(r.restaurant.address)}
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `ORDER CONFIRMED - ${r.confirmation}`,
    `Thanks, ${r.firstName}! We've got your order.`,
    "",
    `${r.method === "pickup" ? "Ready for pickup" : "Delivery"}: ${r.readyAt} (${r.whenLabel})`,
    `${r.method === "pickup" ? "Pick up at" : "Deliver to"}: ${where}`,
    "",
    "YOUR ORDER",
    ...r.items.flatMap((i) => {
      const mods = [...i.removed.map((x) => `No ${x.toLowerCase()}`), ...i.extras, ...(i.note ? [`"${i.note}"`] : [])];
      return [`${i.qty} x ${i.name} - ${usd(i.lineCents)}`, ...(mods.length ? [`    ${mods.join(" | ")}`] : [])];
    }),
    "",
    `Subtotal: ${usd(r.subtotalC)}`,
    `Tax (6%): ${usd(r.taxC)}`,
    `Total:    ${usd(r.totalC)}`,
    ...(r.demo ? ["DEMO ORDER - no payment was taken and nothing was sent to the restaurant."] : r.paidWith ? [`Paid - ${r.paidWith}`] : []),
    ...(r.notes ? ["", `Order notes: ${r.notes}`] : []),
    "",
    `Questions? Call ${r.restaurant.phone}`,
    `${r.restaurant.name} - ${r.restaurant.address}`,
  ].join("\n");

  return { subject, html, text };
}

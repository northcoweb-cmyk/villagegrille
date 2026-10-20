import { INFO, MENU, type MenuItem } from "@/data/menu";

/**
 * Built-in answers for when the AI service is unavailable (or not configured yet).
 * Anything it can't answer from the real menu/hours falls through to the phone number.
 */
export const FALLBACK = `I'm not sure about that, so please call ${INFO.phone} for more information.`;

const ALL: (MenuItem & { cat: string })[] = MENU.flatMap((c) => c.items.map((i) => ({ ...i, cat: c.name })));
const fmt = (i: MenuItem) => `${i.name} ($${i.price.toFixed(2)})`;
const STOP = new Set(["the", "a", "an", "of", "with", "and", "on", "in", "oz", "sub", "sandwich", "do", "you", "have", "is", "are", "how", "much", "does", "cost", "what", "whats", "price", "for", "can", "i", "get", "order", "want", "to", "me", "it"]);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9$.\s]/g, " ").split(/\s+/).filter(Boolean);

function openNow() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const weekend = ["Sat", "Sun"].includes(get("weekday"));
  const mins = (+get("hour") % 24) * 60 + +get("minute");
  const [open, close] = weekend ? [6 * 60, 21 * 60] : [14 * 60, 21 * 60 + 30];
  return mins >= open && mins < close;
}

const CATEGORY_WORDS: [RegExp, string][] = [
  [/breakfast|pancake|omelet|bagel|french toast/, "Breakfast"],
  [/soup|chili|chilli/, "Soup & Chili"],
  [/side|snack|fries|nachos/, "Sides & Snacks"],
  [/pizza/, "Pizza"],
  [/deli/, "Deli Delights"],
  [/\bsubs?\b|hoagie/, "Subs"],
  [/burger/, "Burgers"],
  [/chicken (breast|sandwich)/, "Chicken Breast"],
  [/wrap/, "Wraps"],
  [/panini/, "Paninis"],
  [/tex.?mex|mexican|taco|fajita|burrito|quesadilla/, "Tex-Mex"],
  [/salad/, "Salads"],
  [/kid|junior|\bjr\b/, "Junior Combos"],
];

export function localAnswer(question: string): string {
  const q = question.toLowerCase();

  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(q.trim()) && q.length < 25)
    return "Hi! I can help with our menu, hours, location and ordering. What would you like to know?";
  if (/^(thanks|thank you|thx)\b/.test(q.trim())) return "You're welcome! Enjoy your meal.";

  if (/allerg|gluten|celiac|nut|dairy|lactose|vegan|halal|kosher|calorie|nutrition|ingredient/.test(q))
    return `For allergies, dietary needs and ingredients, please call ${INFO.phone} so the kitchen can confirm for you.`;

  if (/hour|open|close|closing|when are you|what time/.test(q)) {
    const status = openNow() ? "We're open right now." : "We're closed right now.";
    return `${status} Hours: Mon–Fri 2:00 PM – 9:30 PM, Sat–Sun 6:00 AM – 9:00 PM.`;
  }
  if (/address|where|located|location|direction|find you|near/.test(q) && !/parking/.test(q))
    return `We're at ${INFO.address}.`;
  if (/phone|call|number|contact|reach/.test(q)) return `You can call us at ${INFO.phone}.`;

  if (/gift ?card/.test(q))
    return "Gift cards are on our online ordering page, in any amount. They're emailed and can be used online or in-store.";

  // a specific dish
  const qw = words(q).filter((w) => !STOP.has(w));
  if (qw.length) {
    const scored = ALL.map((i) => {
      const nw = words(i.name).filter((w) => !STOP.has(w));
      const hit = nw.filter((w) => qw.some((x) => x === w || (x.length > 3 && w.startsWith(x)) || (w.length > 3 && x.startsWith(w)))).length;
      return { i, score: nw.length ? hit / nw.length : 0, hit };
    }).filter((s) => s.hit > 0 && s.score >= 0.6);
    scored.sort((a, b) => b.score - a.score || b.hit - a.hit);
    const best = scored.filter((s) => s.score === scored[0]?.score).slice(0, 3);
    if (best.length === 1 || (best.length && best[0].score === 1)) {
      const i = best[0].i;
      return `${i.name} is $${i.price.toFixed(2)}.${i.desc ? ` ${i.desc}` : ""} Tap it on the menu to customize it.`;
    }
    if (best.length > 1) return `Did you mean ${best.map((s) => fmt(s.i)).join(", ")}?`;
  }

  // price questions
  const under = q.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+(?:\.\d+)?)/);
  if (under) {
    const list = ALL.filter((i) => i.price <= +under[1]).sort((a, b) => a.price - b.price).slice(0, 6);
    if (list.length) return `Under $${under[1]}: ${list.map(fmt).join(", ")}.`;
  }
  if (/cheap|least expensive|budget/.test(q)) return `Some of our lowest prices: ${[...ALL].sort((a, b) => a.price - b.price).slice(0, 5).map(fmt).join(", ")}.`;

  if (/vegetarian|veggie/.test(q)) {
    const list = ALL.filter((i) => /veg/i.test(i.name) || i.cat === "Veggie Specialties").slice(0, 8);
    return `Veggie options include ${list.map(fmt).join(", ")}. Please call ${INFO.phone} to confirm ingredients.`;
  }

  if (/popular|best|favorite|recommend|suggest|good/.test(q))
    return "Guest favorites are the Gourmet Burger ($13.95), Steak Supreme ($12.95), Burrito Bowl ($14.95) and the California Club Sandwich ($12.95).";

  for (const [re, name] of CATEGORY_WORDS) {
    if (re.test(q)) {
      const cat = MENU.find((c) => c.name === name)!;
      const shown = cat.items.slice(0, 8).map(fmt).join(", ");
      return `${name}: ${shown}${cat.items.length > 8 ? ", and more on the menu" : ""}.`;
    }
  }

  if (/deliver/.test(q))
    return `Online ordering is for pickup right now. For delivery, please call ${INFO.phone}.`;
  if (/pick ?up|take ?out|to go/.test(q)) return "Yes! Order online for pickup. It's usually ready in about 30 minutes.";
  if (/order|online|menu/.test(q))
    return "You can order online for pickup. Tap “Order online”, then tap any dish to remove ingredients, add extras or leave special instructions.";
  if (/what (do|kind)|serve|food|cuisine|about/.test(q))
    return "We serve deli sandwiches and subs, burgers, breakfast, pizza, wraps, salads and Tex-Mex, all in Rockville.";

  return FALLBACK;
}

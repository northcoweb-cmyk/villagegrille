/**
 * GET /api/config -> tells the site how checkout can work right now. Only public values are returned.
 *   mode "square": card payment + order ticket in Square POS
 *   mode "email" : order emailed to the restaurant, customer pays at pickup
 *   mode "link"  : default. Ordering stays on the restaurant's existing ordering page (their POS flow is untouched)
 */
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export default function handler(_req: unknown, res: Res) {
  const e = process.env;
  // Having API keys is not enough: ORDER_MODE must be set on purpose, so the default flow stays the restaurant's existing ordering link.
  const square = e.ORDER_MODE === "square" && !!(e.SQUARE_ACCESS_TOKEN && e.SQUARE_LOCATION_ID && e.SQUARE_APPLICATION_ID);
  const email = e.ORDER_MODE === "email" && !!(e.RESEND_API_KEY && e.ORDER_EMAIL_TO);
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).json({
    mode: square ? "square" : email ? "email" : "link",
    squareAppId: square ? e.SQUARE_APPLICATION_ID : null,
    squareLocationId: square ? e.SQUARE_LOCATION_ID : null,
    squareEnv: e.SQUARE_ENV === "production" ? "production" : "sandbox",
    // their existing ordering page offers pickup and delivery
    delivery: !square && !email ? true : e.ENABLE_DELIVERY === "true",
  });
}

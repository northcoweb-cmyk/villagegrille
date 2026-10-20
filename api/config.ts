/**
 * GET /api/config -> tells the site how checkout can work right now. Only public values are returned.
 *   mode "square": card payment + order ticket in Square POS
 *   mode "email" : order emailed to the restaurant, customer pays at pickup
 *   mode "none"  : not set up; the site tells customers to call
 */
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export default function handler(_req: unknown, res: Res) {
  const e = process.env;
  const square = !!(e.SQUARE_ACCESS_TOKEN && e.SQUARE_LOCATION_ID && e.SQUARE_APPLICATION_ID);
  const email = !!(e.RESEND_API_KEY && e.ORDER_EMAIL_TO);
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).json({
    mode: square ? "square" : email ? "email" : "none",
    squareAppId: square ? e.SQUARE_APPLICATION_ID : null,
    squareLocationId: square ? e.SQUARE_LOCATION_ID : null,
    squareEnv: e.SQUARE_ENV === "production" ? "production" : "sandbox",
    delivery: e.ENABLE_DELIVERY === "true",
  });
}

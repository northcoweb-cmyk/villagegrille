/**
 * GET /api/config -> tells the site how ordering works right now. Only public values are returned.
 *   mode "link"  : default. Ordering stays on the restaurant's existing ordering page (their POS flow is untouched)
 *   mode "square": the site's own checkout; card payment + the order lands in the restaurant's Square POS.
 *                  Only on when ORDER_MODE=square on purpose, with the Square settings present.
 */
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

export default function handler(_req: unknown, res: Res) {
  const e = process.env;
  const square = e.ORDER_MODE === "square" && !!(e.SQUARE_ACCESS_TOKEN && e.SQUARE_LOCATION_ID && e.SQUARE_APPLICATION_ID);
  res.setHeader("Cache-Control", "public, max-age=30");
  res.status(200).json({
    mode: square ? "square" : "link",
    squareAppId: square ? e.SQUARE_APPLICATION_ID : null,
    squareLocationId: square ? e.SQUARE_LOCATION_ID : null,
    squareEnv: e.SQUARE_ENV === "production" ? "production" : "sandbox",
    // their existing ordering page offers pickup and delivery; the Square checkout is pickup-only unless enabled
    delivery: square ? e.ENABLE_DELIVERY === "true" : true,
  });
}

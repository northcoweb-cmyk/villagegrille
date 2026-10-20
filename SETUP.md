# Setup

## Default: nothing to configure
**Order online** opens the restaurant's existing ordering page (`INFO.orderUrl` in `src/data/menu.ts`), so their POS tickets keep
arriving exactly as today. Deploy to Vercel (import the repo, defaults are fine) and it works.

## Optional: orders placed on this site land in their Square POS
Turns on the site's own checkout: the customer pays by card on the site, the order is created in the restaurant's Square account as a
pickup ticket, and the customer gets a receipt email. The restaurant is **not** emailed (the Square ticket is their copy).
This runs **alongside** their current ordering link, so tell the manager before turning it on.

### 1. Test in Square's sandbox first (free, no real money)
1. developer.squareup.com: sign in and create an application.
2. Developer Console, mode **Sandbox**: copy the Application ID, the Sandbox Access Token, and a Location ID (Locations tab).
3. Vercel env vars: `ORDER_MODE=square`, `SQUARE_ENV=sandbox`, `SQUARE_APPLICATION_ID`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`. Redeploy.
4. Place a test order (card `4111 1111 1111 1111`, any future date, CVV `111`, any ZIP; decline test card `4000 0000 0000 0002`).
5. In the sandbox Square Dashboard > Orders you should see the ticket: name, pickup time, items, and per-item notes like `NO: Mayo | ADD: Extra cheese`.

### 2. Receipt emails (Resend)
1. resend.com: create an account and an API key -> `RESEND_API_KEY`.
2. Resend > Domains > Add Domain and add the DNS records they show (at wherever the domain's DNS is managed). Until a domain is verified, Resend only delivers to your own Resend account email.
3. `ORDER_EMAIL_FROM="Village Grille <orders@yourdomain.com>"` (on the verified domain), `SITE_URL=https://your-live-site` (the logo in the email loads from it).
4. Place a sandbox order using your own email and check the receipt (also check spam).

### 3. Connect the restaurant's real Square account (needs the owner)
Orders must be created inside the restaurant's own Square account, so the owner has to authorize it. Two ways:
- **Simplest (recommended for one restaurant):** the owner signs in to developer.squareup.com with his own Square login, creates an application, and (in **Production** mode) shares the Application ID, Access Token and Location ID with you. Because it's his own app on his own account, the access token is his. Send these securely, never in a plain text message or email, and he can revoke them any time in the Developer Console.
- **Proper multi-merchant way:** a Square OAuth app, where he clicks "Authorize" and the site receives a token for his account. More code to build and only worth it if NorthCo will connect many restaurants.
Then set `SQUARE_ENV=production` and the production values (the sandbox values will not work in production; the Location ID must match), redeploy, and place one small real order. Refund it from Square to confirm the ticket, the payment and the receipt.

### 4. Ask the manager before you promise anything
- **How do his tickets print today?** If his kitchen printer/KDS is fed by YourMenu's own device rather than by Square, an order created in Square may show in Square's Orders (and a Square KDS) but may not print where he expects. Look at an order on his POS together.
- Whether he's OK with orders coming from two places (his current link and this site).
- Delivery (see below), and whether he wants a tip option.

## Notes and limits
- **Delivery:** orders created through the API with a DELIVERY fulfillment are not shown in Square POS without a Square partnership agreement, so the Square checkout is pickup-only by default. `ENABLE_DELIVERY=true` adds a Delivery option that creates a pickup ticket with "** DELIVERY ORDER ** Deliver to: ..." in its note; the restaurant must handle the driver themselves.
- Customizations arrive as a line-item note. Showing them as real Square modifiers would need the menu mapped to their Square catalog.
- Extras are free-text requests with no price; add real add-on prices before relying on them.
- Tax is a flat 6% Maryland sales tax on prepared food (Square calculates the order total and that is what is charged); confirm with the restaurant.
- Totals are recomputed on the server from `src/data/menu.ts`. Keep that file in sync with their real prices.
- Square charges its standard card processing fee to the restaurant on these payments.

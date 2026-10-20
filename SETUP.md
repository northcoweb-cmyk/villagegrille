# Setup: orders, payments, emails

How checkout behaves depends on which settings exist (`/api/config` reports the mode):

| Settings present | Checkout mode |
|---|---|
| Square (4 vars) | Card payment on the site; paid order appears as a ticket in the Square POS; email copy if Resend is set |
| Resend only (`RESEND_API_KEY`, `ORDER_EMAIL_TO`) | Order is emailed; customer pays at pickup |
| Nothing | Checkout tells the customer to call the restaurant |

## 1. Deploy (Vercel)
1. vercel.com > Add New Project > import `northcoweb-cmyk/villagegrille` > Deploy (defaults are fine).
2. Add the environment variables below, then redeploy (Deployments > ... > Redeploy). Changes only apply on a new deploy.

## 2. Emails (Resend)
1. resend.com: create an account and an API key -> `RESEND_API_KEY`.
2. `ORDER_EMAIL_TO` = where the restaurant wants order emails.
3. Until a domain is verified in Resend (Domains > Add), it only sends to your own Resend account email. To email the restaurant and customers, verify a domain and set `ORDER_EMAIL_FROM` to an address on it.

## 3. Square: test first (sandbox)
1. developer.squareup.com: sign in, create an application.
2. Developer Console, mode **Sandbox**: copy Application ID, Sandbox Access Token, and a Location ID.
3. Set `SQUARE_ENV=sandbox` plus the three values. Redeploy.
4. Place a test order with card `4111 1111 1111 1111`, any future date, CVV `111`, any ZIP. Declines: `4000 0000 0000 0002`.
5. Check the sandbox Square Dashboard > Orders for the ticket (and the email).

## 4. Square: go live (needs the restaurant owner)
The orders must be created in the restaurant's own Square account, so the owner has to authorize it:
- Easiest: the owner creates an application in their own Square Developer Console and shares the **production** Application ID, Access Token and Location ID (send over a secure channel, never by text/Slack in the clear).
- Set `SQUARE_ENV=production` and the production values. Redeploy. Confirm the production Web Payments script loads (card form shows on checkout).
- Place one small real order and refund it from Square to confirm the ticket, the payment and the emails.
- Tickets showing on a kitchen display or printing on kitchen printers depends on how their Square POS/KDS is set up (online orders).

## Notes and limits
- **Delivery:** orders created through the API with a DELIVERY fulfillment are not shown in Square POS without a Square partnership agreement. So online ordering is pickup-only by default. `ENABLE_DELIVERY=true` adds a Delivery option that creates a pickup ticket with "** DELIVERY ORDER ** Deliver to: ..." in its note; the restaurant must handle the driver/courier themselves.
- Customizations arrive on the ticket as a line-item note (`NO: Mayo | ADD: Extra cheese | NOTE: ...`). Showing them as real Square modifiers would need the menu mapped to their Square catalog.
- Extras are free-text requests with no price; add real add-on prices before relying on them.
- Tax is a flat 6% Maryland sales tax on prepared food; confirm with the restaurant.
- Totals are recomputed on the server from `src/data/menu.ts`. Keep that file in sync with their real prices.

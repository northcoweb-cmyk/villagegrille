# Village Grille

Redesign of ordervillagegrille.com: React + TypeScript + Tailwind, shadcn project structure (`@/` alias, `components.json`, `src/components/ui`).

```
npm install
npm run dev
npm run build
```

- Screens: `/` (home: story, favorites, reviews, hours) and `/menu` (online ordering) in `src/pages`; tiny router in `src/lib/router.tsx` (needs the SPA rewrite in `vercel.json`)
- Photos: `public/photos` (local, resized webp) 
- Menu data: `src/data/menu.ts` (85 items, 14 categories, from order.yourmenu.com/villagegrille)
- Cart: `src/lib/cart.tsx`; checkout submit seam: `src/lib/orders.ts` (currently simulated, wire a real endpoint + payment there)
- Hero animation component: `src/components/ui/connoisseur-stack-interactor.tsx` (GSAP)

## Server functions (`api/`, deployed as Vercel functions)

- `api/chat.ts`: AI chat assistant (Claude via `@anthropic-ai/sdk`), grounded on `src/data/menu.ts`; unsure answers point to the restaurant phone number. Falls back to `src/lib/chat-local.ts` if unavailable.
- `api/order.ts`: validates the order, recomputes prices from the menu, creates the Square order (ticket) and charges the card, then emails the customer a receipt via Resend (`api/_email.ts`). Default is a demo (no payment, no POS); `ORDER_MODE=square` makes it real. `api/config.ts` tells the site which mode it is in.
- Setup guide: `SETUP.md`.
- Environment variables: see `.env.example`.
- Item customizations (removals, extras, notes): `src/data/customizations.ts` and `src/components/item-modal.tsx`.

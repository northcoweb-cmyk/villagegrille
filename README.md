# Village Grille

Redesign of ordervillagegrille.com: React + TypeScript + Tailwind, shadcn project structure (`@/` alias, `components.json`, `src/components/ui`).

```
npm install
npm run dev
npm run build
```

- Menu data: `src/data/menu.ts` (85 items, 14 categories, from order.yourmenu.com/villagegrille)
- Cart: `src/lib/cart.tsx`; checkout submit seam: `src/lib/orders.ts` (currently simulated, wire a real endpoint + payment there)
- Hero animation component: `src/components/ui/connoisseur-stack-interactor.tsx` (GSAP)

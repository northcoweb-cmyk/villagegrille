import { ExternalLink, ShoppingBag } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cart";
import { Component as KineticNav } from "@/components/ui/sterling-gate-kinetic-navigation";
import { CartDrawer } from "@/components/cart-drawer";
import { ItemModal } from "@/components/item-modal";
import { ItemDetail } from "@/components/item-detail";
import { useOrderConfig } from "@/lib/config";
import { Chatbot } from "@/components/chatbot";
import Home from "@/pages/home";
import MenuPage from "@/pages/menu-page";
import { INFO } from "@/data/menu";
import { money } from "@/lib/utils";
import { useParallax, useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { usePath, useLinkInterception } from "@/lib/router";

const navLinks = (ordersHere: boolean) => [
  ordersHere ? { label: "Order online", href: "/menu" } : { label: "Order online", href: INFO.orderUrl, external: true },
  ...(ordersHere ? [] : [{ label: "Our menu", href: "/menu" }]),
  { label: "About us", href: "/#about" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Visit us", href: "/#visit" },
  ...(ordersHere ? [{ label: "Favorites", href: "/#favorites" }] : []),
];

function SiteNav() {
  const { count, setOpen } = useCart();
  const { mode } = useOrderConfig();
  return (
    <KineticNav
      links={navLinks(mode !== "link")}
      hint="Hungry?"
      logoSrc="/logo.png"
      rightSlot={
        mode === "link" ? (
          <a
            href={INFO.orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-zinc-900 shadow-[0_4px_24px_rgb(0_0_0/0.12)] transition hover:bg-zinc-100"
          >
            <ExternalLink className="h-4 w-4 text-brand" />
            Order online
          </a>
        ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open cart, ${count} items`}
          className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-zinc-900 shadow-[0_4px_24px_rgb(0_0_0/0.12)] transition hover:bg-zinc-100"
        >
          <ShoppingBag className="h-4 w-4 text-brand" />
          Cart
          {count > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs text-white">{count}</span>
          )}
        </button>
        )
      }
      footer={
        <div className="space-y-1">
          <p>{INFO.address}</p>
          <p>
            <a href={INFO.phoneHref} className="font-semibold text-white">{INFO.phone}</a>
          </p>
          <p>Mon–Fri 2:00 PM – 9:30 PM · Sat–Sun 6:00 AM – 9:00 PM</p>
        </div>
      }
    />
  );
}

/** Floating "view cart" pill on the menu screen once something is added. */
function CartPill() {
  const { count, subtotal, setOpen, open } = useCart();
  if (!count || open) return null;
  return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 left-4 z-40 sm:left-1/2 flex sm:-translate-x-1/2 items-center gap-3 rounded-full bg-brand px-6 py-3.5 font-bold text-white shadow-2xl transition hover:bg-brand-dark active:scale-95"
    >
      <ShoppingBag className="h-5 w-5" />
      View cart · {count} {count === 1 ? "item" : "items"} · {money(subtotal)}
    </button>
  );
}

function Screens() {
  const path = usePath();
  const { mode } = useOrderConfig();
  useParallax(path);
  return path === "/menu" ? (
    <>
      <MenuPage />
      {mode !== "link" && <CartPill />}
    </>
  ) : (
    <Home />
  );
}

function Overlays() {
  const { mode } = useOrderConfig();
  return mode === "link" ? (
    <ItemDetail />
  ) : (
    <>
      <CartDrawer />
      <ItemModal />
    </>
  );
}

export default function App() {
  useSmoothScroll();
  useLinkInterception();
  return (
    <CartProvider>
      <div className="scroll-progress" aria-hidden />
      <div className="page-curtain" aria-hidden>
        <img src="/logo.png" alt="" />
      </div>
      <SiteNav />
      <main>
        <Screens />
      </main>
      <Overlays />
      <Chatbot />
    </CartProvider>
  );
}

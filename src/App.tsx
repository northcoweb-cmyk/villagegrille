import { ShoppingBag } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cart";
import { Component as KineticNav } from "@/components/ui/sterling-gate-kinetic-navigation";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Specialties } from "@/components/specialties";
import { OrderMenu } from "@/components/order-menu";
import { CartDrawer } from "@/components/cart-drawer";
import { Visit } from "@/components/visit";
import { INFO } from "@/data/menu";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

const links = [
  { label: "Order online", href: "#order" },
  { label: "About us", href: "#about" },
  { label: "Favorites", href: "#specialties" },
  { label: "Reviews", href: "#reviews" },
  { label: "Visit us", href: "#visit" },
];

function SiteNav() {
  const { count, setOpen } = useCart();
  return (
    <KineticNav
      links={links}
      hint="Hungry?"
      logoSrc="/logo.png"
      rightSlot={
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

export default function App() {
  useSmoothScroll();
  return (
    <CartProvider>
      <div className="scroll-progress" aria-hidden />
      <SiteNav />
      <main>
        <Hero />
        <About />
        <Specialties />
        <OrderMenu />
        <Visit />
      </main>
      <CartDrawer />
    </CartProvider>
  );
}

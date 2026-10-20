import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { INFO } from "@/data/menu";
import { INGREDIENTS } from "@/data/customizations";
import { lockScroll } from "@/hooks/use-smooth-scroll";
import { money } from "@/lib/utils";

/** Read-only dish details. Ordering happens on the restaurant's own ordering page. */
export function ItemDetail() {
  const { customizing, closeItem } = useCart();
  const item = customizing?.item;

  useEffect(() => {
    if (!item) return;
    lockScroll(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeItem();
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [item, closeItem]);

  if (!item) return null;
  const includes = INGREDIENTS[item.name];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 bg-black/60" onClick={closeItem} />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <button onClick={closeItem} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow hover:bg-white">
          <X className="h-5 w-5" />
        </button>
        <div data-lenis-prevent className="overflow-y-auto overscroll-contain">
          {item.image && <img src={item.image} alt={item.name} width={800} height={500} className="aspect-[16/10] w-full object-cover" decoding="async" />}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 pr-8">
              <h2 className="text-2xl font-extrabold leading-tight">{item.name}</h2>
              <span className="text-xl font-bold text-brand">{money(item.price)}</span>
            </div>
            {item.desc && <p className="mt-3 text-zinc-600">{item.desc}</p>}
            {includes && (
              <p className="mt-4 text-sm text-zinc-600">
                <span className="font-semibold text-zinc-900">Comes with:</span> {includes.join(", ")}
              </p>
            )}
            <p className="mt-4 text-sm text-zinc-500">Customize it your way (remove ingredients, add notes) when you order online.</p>
          </div>
        </div>
        <div className="flex-none border-t border-black/10 p-4">
          <a
            href={INFO.orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand font-bold text-white transition hover:bg-brand-dark"
          >
            Order online <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

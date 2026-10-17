import { useMemo, useState } from "react";
import { Plus, Search, Check } from "lucide-react";
import { MENU, type MenuItem } from "@/data/menu";
import { useCart } from "@/lib/cart";
import { cn, money } from "@/lib/utils";
import { Reveal } from "@/components/reveal";

function ItemCard({ item }: { item: MenuItem }) {
  const { dispatch, lines } = useCart();
  const qty = lines.find((l) => l.item.id === item.id)?.qty ?? 0;
  const [flash, setFlash] = useState(false);

  const add = () => {
    dispatch({ type: "add", item });
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  return (
    <li className="group flex gap-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 transition hover:border-brand/40 hover:shadow-md hover:bg-white">
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-24 w-24 flex-none rounded-xl object-cover md:h-28 md:w-28"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-display text-lg font-bold leading-tight">{item.name}</h3>
        {item.desc && <p className="mt-1 line-clamp-3 text-sm text-zinc-600">{item.desc}</p>}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-semibold text-brand">{money(item.price)}</span>
          <button
            onClick={add}
            aria-label={`Add ${item.name} to cart`}
            className={cn(
              "flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold transition active:scale-95",
              flash ? "bg-emerald-600 text-white" : "bg-brand text-white hover:bg-brand-dark"
            )}
          >
            {flash ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {qty > 0 && !flash ? qty : flash ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </li>
  );
}

export function OrderMenu() {
  const [active, setActive] = useState("all");
  const [q, setQ] = useState("");

  const cats = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MENU.filter((c) => active === "all" || c.id === active)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) => !needle || i.name.toLowerCase().includes(needle) || i.desc?.toLowerCase().includes(needle)
        ),
      }))
      .filter((c) => c.items.length);
  }, [active, q]);

  return (
    <section id="order" className="relative mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <Reveal className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-semibold font-bold uppercase tracking-widest text-brand">Order online</p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Our menu
          </h2>
        </div>
        <label className="relative block w-full md:w-80">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the menu…"
            className="h-12 w-full rounded-full border border-black/10 bg-zinc-100 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-500 focus:border-brand"
          />
        </label>
      </Reveal>

      <div className="sticky top-0 z-30 -mx-5 mb-10 overflow-x-auto bg-white/90 px-5 py-3 backdrop-blur-xl md:-mx-10 md:px-10 [scrollbar-width:none]">
        <div className="flex w-max gap-2">
          {[{ id: "all", name: "All" }, ...MENU].map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                active === c.id
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-zinc-700 hover:border-black/30"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {cats.length === 0 && <p className="py-20 text-center text-zinc-500">Nothing matches “{q}”.</p>}

      <div className="space-y-14">
        {cats.map((c) => (
          <div key={c.id}>
            <h3 className="mb-5 font-display text-2xl font-bold text-zinc-900">
              {c.name} <span className="text-base font-medium text-zinc-400">{c.items.length}</span>
            </h3>
            <Reveal as="ul" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {c.items.map((i) => (
                <ItemCard key={i.id} item={i} />
              ))}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}

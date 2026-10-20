import { ArrowUpRight } from "lucide-react";
import { MENU, PHOTOS } from "@/data/menu";
import { Reveal } from "@/components/reveal";
import { money } from "@/lib/utils";
import { useCart } from "@/lib/cart";

const all = MENU.flatMap((c) => c.items);
const pick = (name: string, image: string) => ({ ...all.find((i) => i.name === name)!, image });

const picks = [
  pick("Gourmet Burger (6 oz)", PHOTOS.burger),
  pick("Steak Supreme", PHOTOS.steak),
  pick("Burrito Bowl", PHOTOS.burrito),
  pick("California Club Sandwich", PHOTOS.cali),
  pick("Taco Trio", PHOTOS.taco),
  pick("Quesadilla", PHOTOS.quesadilla),
];

export function Favorites() {
  const { openItem } = useCart();
  return (
    <section id="favorites" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <Reveal className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand">Our favorite items</p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">Crowd pleasers.</h2>
        </div>
        <a href="/menu" className="inline-flex items-center gap-2 font-bold text-brand hover:underline">
          View the full menu <ArrowUpRight className="h-5 w-5" />
        </a>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.1}>
            <button
              type="button"
              onClick={() => openItem(p)}
              aria-label={`Customize and order ${p.name}`}
              className="group block w-full overflow-hidden rounded-3xl border border-black/10 bg-zinc-50 text-left transition-colors hover:bg-white"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-start justify-between gap-4 p-6">
                <div>
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  {p.desc && <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{p.desc}</p>}
                </div>
                <span className="rounded-full bg-brand-tint px-3 py-1 text-sm font-bold text-brand">{money(p.price)}</span>
              </div>
              <p className="px-6 pb-6 text-sm font-bold text-brand">Customize &amp; order →</p>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

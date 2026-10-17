import { PHOTOS } from "@/data/menu";
import { Reveal } from "@/components/reveal";

const cards = [
  { title: "Deli Delights", img: PHOTOS.turkey, text: "Hearty, stacked deli classics." },
  { title: "Subs", img: PHOTOS.greek, text: "Hot and cold, piled high on fresh rolls." },
  { title: "Tex-Mex", img: PHOTOS.quesadilla, text: "Bold flavors, house-made salsa." },
];

export function About() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <Reveal className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand">All about Village Grille</p>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Three worlds. One roof.
          </h2>
        </div>
        <div className="space-y-5 text-lg text-zinc-600">
          <p>
            Welcome to Village Grille, where Rockville locals come for seriously good food and plenty of variety.
            Whether you're craving a stacked deli sandwich, a juicy burger, or authentic Tex-Mex, we've got something to
            satisfy every appetite.
          </p>
          <p>
            Your go-to spot for delicious deli sandwiches, classic diner favorites, and flavorful Tex-Mex, right here at
            50 Southlawn Court. Order online for quick pickup or delivery and enjoy your favorites from the comfort of home.
          </p>
        </div>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.12}>
          <a href="/menu" className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl">
            <img src={c.img} alt={c.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
              <h3 className="text-3xl font-extrabold">{c.title}</h3>
              <p className="text-white/80">{c.text}</p>
            </div>
          </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

import { useState } from "react";
import { Clock, MapPin, Navigation, Phone, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { INFO, REVIEWS } from "@/data/menu";
import { Reveal } from "@/components/reveal";

export function Reviews() {
  return (
    <section id="reviews" className="bg-brand-tint">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-10">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand">What our guests say</p>
        <h2 className="mb-12 text-4xl font-extrabold tracking-tight md:text-6xl">Good food, good people.</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {REVIEWS.map((r, i) => (
            <Reveal as="figure" key={r.who} delay={i * 0.12} className="rounded-3xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex gap-0.5 text-brand">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-zinc-700">“{r.text}”</blockquote>
              <figcaption className="mt-4 font-semibold">{r.who}</figcaption>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {Object.entries(INFO.social)
            .filter(([n]) => n !== "Facebook")
            .map(([n, h]) => (
              <a key={n} href={h} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Review us on {n}
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}

export function Visit() {
  const today = (new Date().getDay() + 6) % 7; // Monday = 0
  const [map, setMap] = useState(false);
  return (
    <section id="visit" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand">Come hungry</p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl">Visit us</h2>
          <ul className="mt-8 space-y-5 text-lg">
            <li className="flex gap-4">
              <MapPin className="mt-1 h-5 w-5 flex-none text-brand" />
              <a href={INFO.mapsUrl} target="_blank" rel="noreferrer" className="hover:text-brand">{INFO.address}</a>
            </li>
            <li className="flex gap-4">
              <Phone className="mt-1 h-5 w-5 flex-none text-brand" />
              <a href={INFO.phoneHref} className="hover:text-brand">{INFO.phone}</a>
            </li>
          </ul>
          <div className="mt-8 rounded-3xl border border-black/10 p-6 md:p-8">
            <h3 className="mb-4 flex items-center gap-3 text-2xl font-bold">
              <Clock className="h-5 w-5 text-brand" /> Hours
            </h3>
            <ul className="divide-y divide-black/10">
              {INFO.hours.map(([day, hrs], i) => (
                <li key={day} className={`flex justify-between py-3 ${i === today ? "font-bold text-brand" : "text-zinc-700"}`}>
                  <span>{day}{i === today && " · today"}</span>
                  <span>{hrs}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* the embedded Google map is heavy, so it only loads on request */}
        {map ? (
          <iframe
            title="Map to Village Grille"
            className="h-96 w-full rounded-3xl border border-black/10 md:h-full md:min-h-[520px]"
            src={`https://www.google.com/maps?q=${encodeURIComponent(INFO.address)}&output=embed`}
          />
        ) : (
          <button
            onClick={() => setMap(true)}
            className="group relative grid h-96 w-full place-items-center overflow-hidden rounded-3xl bg-brand-tint text-brand transition-colors hover:bg-brand hover:text-white md:h-full md:min-h-[520px]"
          >
            <span className="flex flex-col items-center gap-3 text-center">
              <Navigation className="h-10 w-10" />
              <span className="text-2xl font-extrabold">Show the map</span>
              <span className="text-sm opacity-80">{INFO.address}</span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

export function OrderCta() {
  return (
    <section className="bg-brand text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-16 md:flex-row md:items-center md:px-10">
        <h2 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Order online and get your favorites today.
        </h2>
        <a
          href="/menu"
          className={buttonVariants({ size: "lg" }) + " !bg-white !text-brand hover:!bg-zinc-100"}
        >
          Start your order
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-5 py-10 text-sm text-zinc-600 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-4">
          <a href="/" aria-label="Village Grille home">
            <img src="/logo.png" alt="Village Grille" width={64} height={64} className="h-16 w-16 object-contain" />
          </a>
          <p>© {new Date().getFullYear()} Village Grille<br />{INFO.address}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-5 font-medium">
          {Object.entries(INFO.social).map(([n, h]) => (
            <a key={n} href={h} target="_blank" rel="noreferrer" className="hover:text-brand">{n}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

import { ArrowRight, MapPin, Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { INFO, PHOTOS } from "@/data/menu";
import { useOrderConfig } from "@/lib/config";

const marquee = ["Deli Delights", "Diner Favorites", "Tex-Mex", "Gourmet Burgers", "Hot Subs", "Breakfast", "Pizza", "Wraps"];

export function Hero() {
  const { delivery } = useOrderConfig();
  return (
    <section id="top" className="relative overflow-hidden pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:px-10 md:pb-24 md:pt-24">
        <div>
          <p style={{ animationDelay: "0.1s" }} className="hero-in mb-6 inline-flex items-center gap-2 rounded-full bg-brand-tint px-4 py-1.5 text-sm font-semibold text-brand">
            <MapPin className="h-4 w-4" /> Rockville, MD
          </p>
          <h1 style={{ animationDelay: "0.25s" }} className="hero-in text-[clamp(3rem,8vw,6.5rem)] font-extrabold leading-[0.92] tracking-tight">
            Where Rockville comes for <span className="text-brand">seriously good food.</span>
          </h1>
          <p style={{ animationDelay: "0.45s" }} className="hero-in mt-6 max-w-lg text-lg text-zinc-600">
            Stacked deli sandwiches, juicy burgers and authentic Tex-Mex. Order online for quick pickup{delivery ? " or delivery" : ""}.
          </p>
          <div style={{ animationDelay: "0.6s" }} className="hero-in mt-8 flex flex-wrap gap-3">
            <a href="/menu" className={buttonVariants({ size: "lg" })}>
              Order online <ArrowRight className="h-5 w-5" />
            </a>
            <a href={INFO.phoneHref} className={buttonVariants({ size: "lg", variant: "outline" })}>
              <Phone className="h-5 w-5" /> {INFO.phone}
            </a>
          </div>
        </div>

        <div style={{ animationDelay: "0.35s" }} className="hero-in relative">
          <div data-parallax="-30" className="absolute -right-6 -top-6 h-full w-full rounded-[2.5rem] bg-brand" />
          <img
            src={PHOTOS.caliLarge}
            alt="California club sandwich at Village Grille"
            className="relative aspect-[4/5] w-full rounded-[2.5rem] object-cover shadow-2xl md:aspect-square"
            fetchPriority="high"
            decoding="async"
          />
          <img
            src={PHOTOS.burrito}
            alt="Burrito bowl"
            data-parallax="60" className="absolute -bottom-6 -left-4 hidden h-36 w-36 rounded-3xl border-4 border-white object-cover shadow-xl md:block"
          />
        </div>
      </div>

      <div className="overflow-hidden bg-brand py-4 text-white">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-xl font-bold uppercase">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-10">
              {m} <span className="opacity-60">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

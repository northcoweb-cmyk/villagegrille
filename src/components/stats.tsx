import { Reveal } from "@/components/reveal";

const stats = [
  ["7", "days a week"],
  ["6 AM", "weekend breakfast"],
  ["85", "items on the menu"],
  ["3", "worlds of flavor"],
];

export function Stats() {
  return (
    <section className="bg-zinc-950 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-5 py-16 md:grid-cols-4 md:px-10 md:py-20">
        {stats.map(([n, l], i) => (
          <Reveal key={l} delay={i * 0.08} className="text-center md:text-left">
            <p className="text-5xl font-extrabold tracking-tight text-white md:text-7xl">{n}</p>
            <p className="mt-2 text-zinc-400">{l}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

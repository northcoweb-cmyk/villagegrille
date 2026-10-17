import { useEffect, useRef, useState } from "react";
import { Component as StackInteractor } from "@/components/ui/connoisseur-stack-interactor";
import { PHOTOS } from "@/data/menu";

const items = [
  { num: "01", name: "Gourmet Burgers", clipId: "clip-original", image: PHOTOS.burger },
  { num: "02", name: "Stacked Subs", clipId: "clip-hexagons", image: PHOTOS.steak },
  { num: "03", name: "Tex Mex", clipId: "clip-pixels", image: PHOTOS.quesadilla },
];

/** The GSAP loop only exists while the section is on (or near) screen. */
export function Specialties() {
  const ref = useRef<HTMLElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { rootMargin: "150px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="specialties" aria-label="Our specialties" className="min-h-screen">
      {live && <StackInteractor items={items} />}
    </section>
  );
}

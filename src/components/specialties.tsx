import { Component as StackInteractor } from "@/components/ui/connoisseur-stack-interactor";
import { PHOTOS } from "@/data/menu";

const items = [
  { num: "01", name: "Gourmet Burgers", clipId: "clip-original", image: PHOTOS.burger },
  { num: "02", name: "Stacked Subs", clipId: "clip-hexagons", image: PHOTOS.steak },
  { num: "03", name: "Tex Mex", clipId: "clip-pixels", image: PHOTOS.quesadilla },
];

export function Specialties() {
  return (
    <section id="specialties" aria-label="Our specialties">
      <StackInteractor items={items} />
    </section>
  );
}

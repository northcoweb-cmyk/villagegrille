import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Specialties } from "@/components/specialties";
import { Favorites } from "@/components/favorites";
import { Stats } from "@/components/stats";
import { Reviews, Visit, OrderCta, Footer } from "@/components/visit";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Specialties />
      <Favorites />
      <Stats />
      <Reviews />
      <Visit />
      <OrderCta />
      <Footer />
    </>
  );
}

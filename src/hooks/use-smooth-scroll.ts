import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Inertia scrolling (Lenis) driven by the GSAP ticker, plus:
 * - animated in-page anchor links
 * - scroll state on <html> (data-scrolled, --progress) for the header bar and progress line
 * - parallax for elements marked data-parallax="<px>"
 * - scroll lock while the kinetic menu is open
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
    });

    lenis.on("scroll", (l: Lenis) => {
      ScrollTrigger.update();
      root.dataset.scrolled = String(l.scroll > 40);
      root.style.setProperty("--progress", String(l.limit ? l.scroll / l.limit : 0));
    });

    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href")!;
      if (hash === "#" || hash === "") return;
      const target = hash === "#top" ? 0 : document.querySelector<HTMLElement>(hash);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: hash === "#top" ? 0 : -72, duration: 1.6 });
    };
    document.addEventListener("click", onClick);

    // lock page scroll while the slide-out menu is open
    const mo = new MutationObserver(() => {
      document.querySelector('[data-nav="open"]') ? lenis.stop() : lenis.start();
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-nav"] });

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 0 },
          {
            y: Number(el.dataset.parallax),
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
          }
        );
      });
    });

    return () => {
      ctx.revert();
      mo.disconnect();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function scrollToTarget(target: number | HTMLElement, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { offset: typeof target === "number" ? 0 : -72, immediate, duration: 1.6 });
  } else if (typeof target === "number") {
    window.scrollTo(0, target);
  } else {
    target.scrollIntoView();
  }
}

/**
 * Inertia scrolling (Lenis) driven by the GSAP ticker.
 * Scroll state is written straight to two DOM nodes (no page-wide CSS variable updates,
 * which would force a style recalculation of the whole document on every scroll event).
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const bar = document.querySelector<HTMLElement>(".scroll-progress");
    let scrolled = false;

    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
    });

    lenis.on("scroll", (l: Lenis) => {
      ScrollTrigger.update();
      const s = l.scroll > 40;
      if (s !== scrolled) {
        scrolled = s;
        root.dataset.scrolled = String(s);
      }
      if (bar) bar.style.transform = `scaleX(${l.limit ? l.scroll / l.limit : 0})`;
    });

    const tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // same-page anchors (#about etc.)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href")!;
      if (hash === "#" || hash === "") return;
      const target = hash === "#top" ? 0 : document.querySelector<HTMLElement>(hash);
      if (target === null) return;
      e.preventDefault();
      scrollToTarget(target);
    };
    document.addEventListener("click", onClick);

    // lock page scroll while the slide-out menu is open
    const mo = new MutationObserver(() => {
      document.querySelector('[data-nav="open"]') ? lenis?.stop() : lenis?.start();
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-nav"] });

    return () => {
      mo.disconnect();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

/** Parallax for elements marked data-parallax="<px>"; re-runs when the screen changes. */
export function useParallax(key: string) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [key]);
}

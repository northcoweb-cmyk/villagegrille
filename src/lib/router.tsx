import { useEffect, useSyncExternalStore } from "react";
import gsap from "gsap";
import { scrollToTarget } from "@/hooks/use-smooth-scroll";

/** Tiny History-API router: two screens, with a curtain wipe between them. */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const norm = (p: string) => p.replace(/\/+$/, "") || "/";
export const getPath = () => norm(window.location.pathname);

function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("popstate", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("popstate", l);
  };
}

export const usePath = () => useSyncExternalStore(subscribe, getPath, () => "/");

let busy = false;

export function navigate(to: string) {
  const url = new URL(to, window.location.href);
  const path = norm(url.pathname);

  // same screen: just scroll
  if (path === getPath()) {
    const el = url.hash ? document.querySelector<HTMLElement>(url.hash) : null;
    scrollToTarget(el ?? 0);
    return;
  }
  if (busy) return;

  const commit = () => {
    window.history.pushState(null, "", path + url.search + url.hash);
    notify();
    scrollToTarget(0, true);
  };
  const jumpToHash = () => {
    const el = url.hash ? document.querySelector<HTMLElement>(url.hash) : null;
    if (el) scrollToTarget(el, true);
  };

  const curtain = document.querySelector<HTMLElement>(".page-curtain");
  if (!curtain || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    commit();
    requestAnimationFrame(jumpToHash);
    return;
  }

  busy = true;
  gsap
    .timeline({ onComplete: () => { busy = false; } })
    .set(curtain, { display: "grid", yPercent: 100 })
    .to(curtain, { yPercent: 0, duration: 0.55, ease: "power3.inOut" })
    .add(commit)
    .to(curtain, { yPercent: -100, duration: 0.65, ease: "power3.inOut", delay: 0.18, onStart: jumpToHash })
    .set(curtain, { display: "none" });
}

/** Routes internal links through navigate() and resets scroll on back/forward. */
export function useLinkInterception() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href")!;
      if (!href.startsWith("/")) return;
      e.preventDefault();
      navigate(href);
    };
    const onPop = () => scrollToTarget(0, true);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onPop);
    };
  }, []);
}

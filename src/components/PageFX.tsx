"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for the whole page, driven by data attributes so the
 * server components stay plain markup:
 *
 *  - [data-reveal]   fades and lifts into place when scrolled into view
 *  - [data-count]    counts up to its text value (the final value is the server-rendered text)
 *  - .spot           tracks the pointer for the hover spotlight (--mx / --my)
 *  - .site-nav       gets data-scrolled, a reading-progress variable (--p) and scroll-spy links
 *
 * Nothing is hidden until this effect has run, so without JavaScript every
 * section is simply visible. With prefers-reduced-motion it does nothing at all.
 */
export function PageFX() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>(".site-nav");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    // --- Navigation: scrolled state and reading progress ---
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!nav) return;
        const max = root.scrollHeight - innerHeight;
        nav.dataset.scrolled = String(scrollY > 8);
        nav.style.setProperty("--p", max > 0 ? String(Math.min(1, scrollY / max)) : "0");
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => { removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); });

    // --- Mobile menu closes after choosing a link ---
    const menu = document.querySelector<HTMLDetailsElement>("details.nav-mobile");
    const closeMenu = () => { if (menu) menu.open = false; };
    menu?.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) closeMenu(); });

    // --- Scroll-spy: mark the nav link of the section in view ---
    const links = [...document.querySelectorAll<HTMLAnchorElement>('.nav-center a[href^="#"]')];
    // Every top-level section is watched; one without a nav link clears the highlight instead of leaving a stale one.
    const targets = [...document.querySelectorAll<HTMLElement>("main > section")];
    if (links.length && targets.length) {
      const spy = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          for (const a of links) {
            if (e.target.id && a.hash === `#${e.target.id}`) a.setAttribute("aria-current", "true");
            else a.removeAttribute("aria-current");
          }
        }
      }, { rootMargin: "-45% 0px -50% 0px" });
      targets.forEach((el) => spy.observe(el));
      cleanups.push(() => spy.disconnect());
    }

    if (reduced) return () => cleanups.forEach((fn) => fn());

    // --- Pointer spotlight on cards ---
    let spotFrame = 0;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>(".spot");
      if (!el || spotFrame) return;
      spotFrame = requestAnimationFrame(() => {
        spotFrame = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    cleanups.push(() => document.removeEventListener("pointermove", onMove));

    // --- Count-up numbers ---
    // The parsed parts are cached on the element: React strict mode runs this effect twice in
    // development, and the second pass must not read a half-counted value as the target.
    const counted = new WeakSet<Element>();
    const countUp = (el: HTMLElement) => {
      if (counted.has(el)) return;
      counted.add(el);
      if (!el.dataset.countTo) {
        const m = (el.textContent ?? "").match(/^(\D*)(\d+)(\D*)$/);
        if (!m) return;
        [, el.dataset.countPre, el.dataset.countTo, el.dataset.countPost] = m;
      }
      const { countPre: pre = "", countTo = "0", countPost: post = "" } = el.dataset;
      const target = Number(countTo);
      const t0 = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        el.textContent = `${pre}${Math.round(target * (1 - (1 - t) ** 3))}${post}`;
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = `${pre}0${post}`;
      requestAnimationFrame(tick);
    };

    // --- Scroll reveal ---
    // Anything already on screen (or scrolled past) is marked in before `fx` hides the rest,
    // so nothing flashes on load or after a reload mid-page.
    const reveals = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const counters = [...document.querySelectorAll<HTMLElement>("[data-count]")];
    const onScreen = (el: Element) => el.getBoundingClientRect().top < innerHeight;
    reveals.filter(onScreen).forEach((el) => el.classList.add("in"));
    counters.filter(onScreen).forEach(countUp);
    root.classList.add("fx");

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add("in");
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      }
    }, { threshold: 0, rootMargin: "0px 0px 8% 0px" });
    new Set([...reveals, ...counters]).forEach((el) => {
      if (!el.classList.contains("in") && !counted.has(el)) io.observe(el);
    });
    cleanups.push(() => { io.disconnect(); root.classList.remove("fx"); });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}

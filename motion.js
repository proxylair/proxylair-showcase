// ProxyLair public showcase -- Wave 1 premium motion polish (scroll
// reveals, hero entrance/parallax). Purely additive on top of app.js's
// data rendering; touches no structure, copy, or gallery/watch/gear
// mechanics. Every element this script would hide is hidden via
// gsap.set() *immediately before* animating it in -- never via a CSS
// default -- so if the CDN fails to load or errors out, nothing on the
// page is ever left invisible; it just renders as plain static HTML/CSS.

(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || typeof gsap === "undefined") {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const revealed = new WeakSet();

  // Single-element fade + rise, triggered once as it enters the viewport.
  function revealOnScroll(el, opts) {
    opts = opts || {};
    if (!el || revealed.has(el)) return;
    revealed.add(el);
    gsap.set(el, { opacity: 0, y: opts.y || 26 });
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: opts.duration || 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  }

  // Grouped fade + rise with stagger, for grid/list children -- uses
  // ScrollTrigger.batch so the whole group animates together as one
  // scroll-triggered unit rather than one trigger per child.
  function revealBatch(selector, opts) {
    opts = opts || {};
    const els = gsap.utils.toArray(selector).filter((el) => !revealed.has(el));
    if (!els.length) return;
    els.forEach((el) => revealed.add(el));
    ScrollTrigger.batch(els, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => {
        gsap.set(batch, { opacity: 0, y: opts.y || 24 });
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: opts.duration || 0.7,
          ease: "power3.out",
          stagger: opts.stagger || 0.08,
        });
      },
    });
  }

  // ---------- Static content (present at first parse) ----------

  function initStaticReveals() {
    document.querySelectorAll(".section-heading").forEach((el) => revealOnScroll(el));
    revealBatch(".process-steps .process-step", { y: 28 });
    revealBatch(".home-philosophy .prose > p", { y: 18, duration: 0.65, stagger: 0.1 });
    revealBatch(".about .prose > p", { y: 18, duration: 0.65, stagger: 0.1 });
    document.querySelectorAll(".legal .prose").forEach((el) => revealOnScroll(el, { y: 18, duration: 0.7 }));
  }

  // ---------- Dynamic content (rendered by app.js after data loads) ----------

  function initDynamicReveals() {
    revealBatch(".gallery-grid .flip-card", { y: 30 });
    revealBatch(".watch-embed .watch-item", { y: 24 });
    revealBatch(".gear-links .gear-link", { y: 22 });
    revealBatch(".social-links .social-pill", { y: 14, duration: 0.5, stagger: 0.05 });
    revealBatch(".contact-actions > *", { y: 16, duration: 0.55, stagger: 0.08 });
    revealBatch(".email-copy", { y: 12, duration: 0.5 });
    // New content can change the page's scrollable height (the gallery
    // especially) -- recalc existing trigger positions against it.
    ScrollTrigger.refresh();
  }

  // ---------- Hero (index.html only) ----------

  function initHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const kicker = hero.querySelector(".hero-kicker");
    const wordmark = hero.querySelector(".hero-wordmark");
    const tagline = hero.querySelector(".hero-tagline");
    const subline = hero.querySelector(".hero-subline");
    const cta = hero.querySelector(".btn");
    const rule = document.querySelector(".hero-rule");
    const entrance = [kicker, wordmark, tagline, subline, cta].filter(Boolean);

    if (entrance.length) {
      gsap.set(entrance, { opacity: 0, y: 22 });
      if (rule) gsap.set(rule, { scaleX: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (kicker) tl.to(kicker, { opacity: 1, y: 0, duration: 0.6 });
      if (wordmark) tl.to(wordmark, { opacity: 1, y: 0, duration: 0.85 }, "-=0.35");
      if (tagline) tl.to(tagline, { opacity: 1, y: 0, duration: 0.6 }, "-=0.5");
      if (subline) tl.to(subline, { opacity: 1, y: 0, duration: 0.6 }, "-=0.4");
      if (cta) tl.to(cta, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35");
      if (rule) tl.to(rule, { scaleX: 1, duration: 0.8, ease: "power2.out" }, "-=0.3");
    }

    // Subtle parallax on the hero photo -- a GPU-only transform tied to
    // native scroll via scrub (not a scroll-jacking library), capped to
    // a small range so it reads as depth, not a gimmick.
    const bg = document.getElementById("hero-bg");
    if (bg) {
      // Matches the -8% overscan on .hero-bg in styles.css so this
      // never reveals a gap at the edge it shifts away from.
      gsap.to(bg, {
        yPercent: 8,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });
    }
  }

  function whenDomReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  whenDomReady(() => {
    initHero();
    initStaticReveals();
  });
  document.addEventListener("showcase:content-ready", initDynamicReveals);
})();

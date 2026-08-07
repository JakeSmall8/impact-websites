/* Impact Websites motion engine
   parallax, reveals, split text, scramble, tilt, spotlight glow */

(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const docEl = document.documentElement;

  /* ---------- nav ---------- */

  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });

    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- scroll progress bar ---------- */

  const progress = document.createElement("div");
  progress.className = "progress";
  document.body.appendChild(progress);

  /* ---------- reveal on scroll ---------- */

  const revealables = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  revealables.forEach((el) => io.observe(el));

  /* ---------- scroll-driven parallax ---------- */
  /* On touch phones/tablets keep only hero-scoped parallax to avoid scroll
     jank. Desktop keeps everything, even when the window is resized narrow. */

  const isTouchNarrow = window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches;
  const layers = [...document.querySelectorAll("[data-parallax]")]
    .filter((el) => !isTouchNarrow || el.closest(".hero"))
    .map((el) => ({
      el,
      speed: parseFloat(el.dataset.parallax) || 0.2,
    }));

  let ticking = false;

  function applyParallax() {
    const vh = window.innerHeight;
    for (const { el, speed } of layers) {
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
    ticking = false;
  }

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);
    const max = docEl.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    if (reduceMotion || !layers.length) return;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyParallax);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
  if (!reduceMotion) applyParallax();

  /* ---------- pointer parallax on hero orbs (desktop) ---------- */

  const hero = document.querySelector(".hero, .page-hero");
  const orbs = hero ? [...hero.querySelectorAll(".orb")] : [];
  const scene = hero ? hero.querySelector(".stage-showcase") : null;

  if (!reduceMotion && (orbs.length || scene) && finePointer) {
    let raf = null;
    hero.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 14;
          orb.style.translate = `${(-x * depth).toFixed(1)}px ${(-y * depth).toFixed(1)}px`;
        });
        if (scene) scene.style.translate = `${(x * 8).toFixed(1)}px ${(y * 6).toFixed(1)}px`;
        // wordmark echo layers read these for counter-drift
        hero.style.setProperty("--mx", x.toFixed(3));
        hero.style.setProperty("--my", y.toFixed(3));
        raf = null;
      });
    });
  }

  /* ---------- split-text headline reveal ---------- */

  const splitEls = document.querySelectorAll("[data-split]");
  if (!reduceMotion && splitEls.length) {
    splitEls.forEach((el) => {
      let i = 0;
      [...el.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!node.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (!part.trim()) { frag.append(" "); return; }
            const w = document.createElement("span");
            w.className = "w";
            for (const ch of part) {
              const c = document.createElement("span");
              c.className = "c";
              c.style.setProperty("--i", i++);
              c.textContent = ch;
              w.append(c);
            }
            frag.append(w);
          });
          node.replaceWith(frag);
        } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
          // treat styled spans (gradient / serif) as one sliding chunk
          const w = document.createElement("span");
          w.className = "w";
          node.replaceWith(w);
          w.append(node);
          node.classList.add("c");
          node.style.setProperty("--i", i);
          i += 3;
        }
      });
    });
    const go = () =>
      setTimeout(() => splitEls.forEach((el) => el.classList.add("split-in")), 80);
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go);
  }

  /* ---------- text scramble ---------- */

  const scrambleEls = document.querySelectorAll("[data-scramble]");
  if (!reduceMotion && scrambleEls.length) {
    const glyphs = "#£$%&/\\<>[]*+-=~";
    scrambleEls.forEach((el) => {
      const finalText = el.textContent;
      let frame = 0;
      const total = 34;
      const tick = () => {
        frame++;
        const p = frame / total;
        el.textContent = [...finalText]
          .map((ch, idx) =>
            ch === " " ? " " : idx / finalText.length < p ? ch : glyphs[(Math.random() * glyphs.length) | 0]
          )
          .join("");
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = finalText;
      };
      const sio = new IntersectionObserver(
        (es) =>
          es.forEach((en) => {
            if (en.isIntersecting) {
              sio.disconnect();
              requestAnimationFrame(tick);
            }
          }),
        { threshold: 0.4 }
      );
      sio.observe(el);
    });
  }

  /* ---------- animated counters ---------- */

  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          cio.unobserve(entry.target);
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || "";
          if (reduceMotion) {
            el.textContent = target + suffix;
            return;
          }
          const start = performance.now();
          const dur = 1400;
          (function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          })(start);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- pinned laptop scroll scene ---------- */

  const pinWrap = document.querySelector(".pin-wrap");
  if (pinWrap) {
    if (reduceMotion) {
      pinWrap.style.setProperty("--p", "1");
    } else {
      let pinQueued = false;
      const updatePin = () => {
        pinQueued = false;
        const total = pinWrap.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -pinWrap.getBoundingClientRect().top / total));
        pinWrap.style.setProperty("--p", p.toFixed(4));
      };
      window.addEventListener(
        "scroll",
        () => {
          if (!pinQueued) {
            pinQueued = true;
            requestAnimationFrame(updatePin);
          }
        },
        { passive: true }
      );
      window.addEventListener("resize", updatePin, { passive: true });
      updatePin();
    }
  }

  /* ---------- 3D tilt ---------- */

  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        el.style.transition = "transform 0.18s ease-out";
      });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
        el.style.transition = "";
      });
    });
  }

  /* ---------- spotlight glow (pointer-tracked borders + wash) ---------- */

  const glows = [...document.querySelectorAll(".glow")];
  if (finePointer && glows.length) {
    let gx = -500, gy = -500, queued = false;
    const paint = () => {
      queued = false;
      docEl.style.setProperty("--xp", (gx / window.innerWidth).toFixed(3));
      for (const el of glows) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--lx", (gx - r.left).toFixed(1));
        el.style.setProperty("--ly", (gy - r.top).toFixed(1));
      }
    };
    const queue = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(paint);
      }
    };
    window.addEventListener("pointermove", (e) => { gx = e.clientX; gy = e.clientY; queue(); }, { passive: true });
    window.addEventListener("scroll", queue, { passive: true });
  }

  /* ---------- before / after compare slider ---------- */

  document.querySelectorAll("[data-compare]").forEach((el) => {
    const range = el.querySelector(".compare-range");
    const frame = el.querySelector(".compare-frame");
    if (!range) return;
    const set = () => el.style.setProperty("--pos", range.value + "%");
    range.addEventListener("input", set);
    set();

    // Native range inputs don't drag by touch on mobile (invisible thumb), so the
    // frame drives the divider directly. A press on the frame starts the drag;
    // movement and release are tracked on the WINDOW so the drag keeps working
    // no matter where the finger goes and can be repeated any number of times.
    // We deliberately avoid setPointerCapture, whose unreliable release on iOS
    // left the slider draggable exactly once and then stuck.
    if (frame) {
      let dragging = false;
      const track = (clientX) => {
        const rect = frame.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
        range.value = pct;
        set();
      };
      const pointX = (e) => (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
      const startDrag = (e) => {
        dragging = true;
        track(pointX(e));
      };
      const moveDrag = (e) => {
        if (!dragging) return;
        track(pointX(e));
      };
      const stopDrag = () => {
        dragging = false;
      };
      // pointer events cover mouse + modern touch; touch events are a fallback
      // for any browser where pointer events on the frame misbehave
      frame.addEventListener("pointerdown", startDrag);
      window.addEventListener("pointermove", moveDrag, { passive: true });
      window.addEventListener("pointerup", stopDrag);
      window.addEventListener("pointercancel", stopDrag);
      frame.addEventListener("touchstart", startDrag, { passive: true });
      window.addEventListener("touchmove", moveDrag, { passive: true });
      window.addEventListener("touchend", stopDrag);
      window.addEventListener("touchcancel", stopDrag);
    }
  });

  /* ---------- floating WhatsApp button + footer social icons (every page) ---------- */

  const WA_LINK = "https://wa.me/447938561686";
  const WA_PATH =
    '<path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.5 9.5 0 0 1-4.84-1.33l-.35-.2-3.6.94.96-3.51-.23-.36a9.46 9.46 0 0 1-1.45-5.05c0-5.24 4.27-9.5 9.52-9.5 2.54 0 4.93.99 6.73 2.79a9.44 9.44 0 0 1 2.79 6.72c0 5.24-4.27 9.5-9.52 9.5zm8.1-17.6A11.4 11.4 0 0 0 12.05.5C5.76.5.65 5.6.65 11.87c0 2.02.53 3.98 1.53 5.72L.5 23.5l6.05-1.58a11.44 11.44 0 0 0 5.49 1.4h.01c6.29 0 11.4-5.1 11.4-11.37 0-3.04-1.19-5.9-3.34-8.05z"/>';
  const WA_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WA_PATH}</svg>`;

  if (!document.querySelector(".wa-float")) {
    const wa = document.createElement("a");
    wa.className = "wa-float";
    wa.href = WA_LINK;
    wa.target = "_blank";
    wa.rel = "noopener";
    wa.setAttribute("aria-label", "Message Impact Websites on WhatsApp");
    wa.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WA_PATH}</svg>`;
    document.body.appendChild(wa);
  }

  const FB_ICON =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>';
  const LI_ICON =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>';

  const SOCIALS = [
    { href: WA_LINK, label: "WhatsApp", icon: WA_ICON },
    { href: "https://www.facebook.com/share/1FsRioQz7S/?mibextid=wwXIfr", label: "Facebook", icon: FB_ICON },
    { href: "https://www.linkedin.com/in/jakesmall-webdesign?utm_source=share_via&utm_content=profile&utm_medium=member_ios", label: "LinkedIn", icon: LI_ICON },
  ];

  const footerWrap = document.querySelector("footer .wrap");
  if (footerWrap && !footerWrap.querySelector(".socials")) {
    const row = document.createElement("div");
    row.className = "socials";
    row.innerHTML = SOCIALS.map(
      (s) =>
        `<a class="social" href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}">${s.icon}</a>`
    ).join("");
    footerWrap.appendChild(row);
  }

  /* ---------- cookie consent banner (UK PECR / UK GDPR) ---------- */

  const CONSENT_KEY = "iw-cookie-consent";
  const GA_ID = "G-31Y7LJFKMM";

  // only ever called after explicit "accept" consent, never on decline or by default
  function loadGoogleAnalytics() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }

  const existingConsent = localStorage.getItem(CONSENT_KEY);
  if (existingConsent === "accept") loadGoogleAnalytics();

  if (!existingConsent && !document.querySelector(".cookie")) {
    const banner = document.createElement("div");
    banner.className = "cookie";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie notice");
    banner.innerHTML =
      '<p>We use essential storage to remember this choice, and Google Analytics if you accept. See our <a href="privacy.html">privacy policy</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button class="btn btn-primary" data-consent="accept">Accept</button>' +
      '<button class="btn btn-ghost" data-consent="decline">Decline</button>' +
      "</div>";
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add("show"));

    banner.addEventListener("click", (e) => {
      const choice = e.target.closest("[data-consent]");
      if (!choice) return;
      localStorage.setItem(CONSENT_KEY, choice.dataset.consent);
      if (choice.dataset.consent === "accept") loadGoogleAnalytics();
      banner.classList.remove("show");
      setTimeout(() => banner.remove(), 500);
    });
  }
})();

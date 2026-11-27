/* AUTOLAB — scroll choreography (GSAP + ScrollTrigger + Lenis). */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmall = () => window.matchMedia("(max-width: 820px)").matches;

  /* Libraries come from the CDN; fall back to the vendored copies offline. */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  async function ensureLibs() {
    if (!window.gsap) await loadScript("vendor/gsap.min.js");
    if (!window.ScrollTrigger) await loadScript("vendor/ScrollTrigger.min.js");
    if (!window.Lenis) await loadScript("vendor/lenis.min.js").catch(() => {});
  }

  /* ---------------------------------------------------------------- slate */
  const I18N = window.AUTOLAB_I18N || { t: (k) => k, lang: "en" };
  const t = (k, v) => I18N.t(k, v);
  const slate = { photo: $("#slReel"), cam: $("#slCam") };
  let slateNow = ["6872163", "cam.hero"];
  // photo is a Pexels number or a text key; cam is a text key
  function setSlate(photo, cam) {
    slateNow = [photo, cam];
    const ph = /^\d+$/.test(photo) ? photo : t(photo), c = t(cam);
    if (slate.photo.textContent !== ph) slate.photo.textContent = ph;
    if (slate.cam.textContent !== c) slate.cam.textContent = c;
    slate.cam.removeAttribute("data-i18n");
  }

  /* ---------------------------------------------------------------- init */
  async function init() {
    await ensureLibs();
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* Lenis smooth scroll, driven by GSAP's ticker so pins and scrubs stay in lockstep */
    let lenis = null;
    if (window.Lenis && !reduceMotion) {
      lenis = new window.Lenis({ lerp: 0.14, wheelMultiplier: 0.8, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }));

    /* ---------- 01 HERO: drive in, drive out, tyre smoke ---------- */
    const stage = $("#heroStage"), car = $("#car"), carInner = $("#carInner"), heroImg = $("#heroImg");
    const smoke = !reduceMotion && window.Smoke ? new window.Smoke($("#smoke")) : null;

    // where the smoke comes from, as fractions of the car photo:
    // the cropped rear quarter (left edge) and the visible front tyre's contact patch
    const EMIT = [[0.05, 0.86], [0.27, 0.95]];
    const emitPoints = () => {
      const s = stage.getBoundingClientRect(), r = heroImg.getBoundingClientRect();
      return { r, pts: EMIT.map(([fx, fy]) => [r.left - s.left + r.width * fx, r.top - s.top + r.height * fy]) };
    };

    let lastX = null, heroOn = true, leaving = false;
    function smokeTick(time, dt) {
      if (!smoke || !heroOn) return;
      const { r, pts } = emitPoints();
      const x = r.left;
      const sec = Math.max(dt / 1000, 1 / 120);
      const v = lastX === null ? 0 : (x - lastX) / sec;
      lastX = x;
      const speed = Math.abs(v);
      if (speed > 40 && r.right > 0 && r.left < window.innerWidth) {
        // arriving: a light haze; leaving under scroll: a fuller trail
        const k = leaving ? 0.55 : 0.2;
        const rate = Math.min(1.5, speed / 1000) * k;
        const dir = Math.sign(v);
        pts.forEach(([px, py], i) => {
          if (Math.random() > rate) return;
          smoke.emit(px, py, {
            n: 1, vx: -dir * (50 + speed * 0.1), vy: -22, spread: 70,
            size: r.width * (leaving ? (i === 0 ? 0.065 : 0.05) : (i === 0 ? 0.05 : 0.04)),
            life: leaving ? 1.5 : 1.3, alpha: leaving ? .26 : .14,
          });
        });
      }
      if (smoke.active) smoke.step(sec);
    }
    gsap.ticker.add(smokeTick);

    function burnout(strength = 1) {
      if (!smoke) return;
      const { r, pts } = emitPoints();
      pts.forEach(([px, py], i) => smoke.emit(px, py, {
        n: Math.round((i === 0 ? 9 : 6) * strength), vx: -170, vy: -30, spread: 150,
        size: r.width * (i === 0 ? 0.075 : 0.06), life: 1.7, alpha: .28,
      }));
    }

    /* loader: wait for the car photograph */
    const loader = $("#loader"), pct = $("#loaderPct"), bar = $("#loaderBar");
    let revealed = false;
    const reveal = () => {
      if (revealed) return; revealed = true;
      pct.textContent = 100; bar.style.transform = "scaleX(1)";
      loader.classList.add("is-done");
      gsap.from("#heroWord", { yPercent: 30, opacity: 0, duration: 1.6, ease: "expo.out", delay: .2 });
      gsap.from(".hero__copy .eyebrow, .hero__foot", { y: 18, opacity: 0, duration: 1.1, ease: "power3.out", delay: 1.4, stagger: .1 });
      if (reduceMotion) return;
      // the car rolls in from the left edge of the set and settles in the middle
      gsap.fromTo(carInner, { x: () => -(window.innerWidth * 0.5 + car.offsetWidth * 1.1) },
        { x: 0, duration: 2.6, ease: "power3.out", delay: .35 });
    };
    gsap.to(bar, { scaleX: .85, duration: 1.2, ease: "power2.out",
      onUpdate() { if (!revealed) pct.textContent = Math.round(gsap.getProperty(bar, "scaleX") * 100); } });
    if (heroImg.complete && heroImg.naturalWidth) reveal();
    else {
      heroImg.addEventListener("load", () => (heroImg.decode ? heroImg.decode() : Promise.resolve()).catch(() => {}).then(reveal), { once: true });
      heroImg.addEventListener("error", reveal, { once: true });
    }
    setTimeout(reveal, 8000); // never trap the visitor behind the loader

    // scroll: the car pulls away to the right and leaves its smoke behind
    const EXIT_AT = .16;
    let lastP = 0;
    const heroTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".hero", start: "top top", end: "+=220%", scrub: 0.6, pin: true, anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (st) => {
          const p = st.progress;
          if (lastP < EXIT_AT + .01 && p >= EXIT_AT + .01 && st.direction > 0) burnout(1);
          leaving = st.direction > 0 && p > EXIT_AT;
          // once the car has left the set, the smoke goes with it: nothing lingers over the next section
          if (p > EXIT_AT + .6 && smoke && smoke.active) smoke.clear();
          lastP = p;
        },
        onEnterBack: () => setSlate("6872163", "cam.hero"),
      },
    });
    if (!reduceMotion) {
      heroTl
        .to(".hero__copy .eyebrow, .hero__foot", { opacity: 0, y: -20, duration: .1 }, .02)
        .to(car, { x: () => window.innerWidth * 0.5 + car.offsetWidth * 1.05, duration: .5, ease: "power2.in" }, EXIT_AT)
        .to("#heroWord", { letterSpacing: "0.1em", duration: .35, ease: "power1.inOut" }, .5)
        .fromTo("#smoke", { opacity: 1 }, { opacity: 0, duration: .12, ease: "power1.in" }, EXIT_AT + .42)
        .to("#heroWord", { opacity: 0, yPercent: -20, duration: .18, ease: "power1.in" }, .8)
        .to({}, { duration: .04 });
    }
    // smoke only runs while the hero is on screen (pinned, or scrolling away)
    gsap.ticker.add(() => {
      const st = heroTl.scrollTrigger;
      const on = !st || window.scrollY < st.end + window.innerHeight;
      if (on !== heroOn) { heroOn = on; lastX = null; if (!on && smoke) smoke.clear(); }
    });

    /* ---------- 02 SUBJECT: the light bar opens into the car ---------- */
    const subTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".subject", start: "top top", end: "+=170%", scrub: 0.6, pin: true, anticipatePin: 1,
        onEnter: () => setSlate("6873074", "cam.headon"),
        onEnterBack: () => setSlate("6873074", "cam.headon"),
      },
    });
    subTl
      .fromTo("#subjectMedia", { clipPath: "inset(49.6% 0% 49.6% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .4, ease: "power2.inOut" }, 0)
      .fromTo("#subjectMedia img", { scale: 1.06 }, { scale: 1, duration: .44 }, 0);
    if (isSmall()) {
      subTl.from(".subject__copy > *", { opacity: 0, y: 30, duration: .14, stagger: .05, ease: "power2.out" }, .42);
    } else {
      // desktop: the frame crops to a left panel and the car settles into it; specs take the right column
      subTl
        .to("#subjectMedia", { clipPath: "inset(7% 41% 7% 0%)", duration: .26, ease: "power2.inOut" }, .44)
        .to("#subjectMedia img", { xPercent: -24, scale: .64, duration: .26, ease: "power2.inOut" }, .44)
        .from(".subject__copy .eyebrow, .subject__copy .display", { opacity: 0, x: 40, duration: .16, stagger: .05, ease: "power2.out" }, .56)
        .from(".spec > div", { opacity: 0, x: 30, duration: .1, stagger: .035, ease: "power2.out" }, .64);
    }
    subTl.to({}, { duration: .12 });

    /* ---------- 03 PROCESS: plays by itself, one stage every 4 seconds ---------- */
    const layers = $$(".layer"), steps = $$("#steps li"), caps = $$(".cap");
    const wipe = $("#wipe"), railFill = $("#railFill");
    const N = layers.length, STEP_MS = 4000;
    let active = 0, z = 1, elapsed = 0, inView = false, held = false, last = 0;

    layers.forEach((l, i) => gsap.set(l, { clipPath: i === 0 ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)", zIndex: i === 0 ? 1 : 0 }));
    steps.forEach((li, i) => {
      li.tabIndex = 0; li.setAttribute("role", "button");
      const pick = () => { go(i); elapsed = 0; };
      li.addEventListener("click", pick);
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });

    function mark(k) {
      steps.forEach((li, i) => { li.classList.toggle("is-on", i === k); li.setAttribute("aria-pressed", String(i === k)); });
      caps.forEach((c, i) => c.classList.toggle("is-on", i === k));
      if (inView) setSlate(layers[k].dataset.reel, layers[k].dataset.cam);
    }
    // the next stage is wiped in from the top behind a light bar; the photo settles over its 4 seconds
    function go(k) {
      if (k === active) return;
      const layer = layers[k], kb = $(".kb", layer);
      gsap.killTweensOf([layer, wipe]);
      layer.style.zIndex = ++z;
      active = k; mark(k);
      if (reduceMotion) { gsap.set(layer, { clipPath: "inset(0% 0% 0% 0%)" }); return; }
      gsap.fromTo(layer, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .9, ease: "power2.inOut" });
      gsap.fromTo(wipe, { top: "0%", opacity: 1 }, { top: "100%", duration: .9, ease: "power2.inOut",
        onComplete: () => gsap.set(wipe, { opacity: 0 }) });
      if (kb) gsap.fromTo(kb, { scale: 1.04 }, { scale: 1, duration: STEP_MS / 1000 + .5, ease: "none" });
    }
    mark(0);

    // the clock only runs while the section is on screen, the tab is visible and the mouse is not resting on the photo
    ScrollTrigger.create({ trigger: ".process", start: "top 60%", end: "bottom 40%",
      onToggle: (st) => { inView = st.isActive; if (inView) setSlate(layers[active].dataset.reel, layers[active].dataset.cam); } });
    document.addEventListener("visibilitychange", () => { last = 0; });
    const screenEl = $("#screen");
    screenEl.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") held = true; });
    screenEl.addEventListener("pointerleave", () => { held = false; });
    gsap.ticker.add((time) => {
      const now = time * 1000, dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (!inView || held || document.hidden || reduceMotion) return;
      elapsed += dt;
      if (elapsed >= STEP_MS) { elapsed = 0; go((active + 1) % N); }
      railFill.style.transform = `scaleX(${(active + elapsed / STEP_MS) / N})`;
    });

    /* ---------- 04 MACRO: masks open, frames drift ---------- */
    $$(".mc").forEach((mc) => {
      const box = $(".mc__img", mc), img = $("img", mc), speed = +mc.dataset.speed || 0;
      gsap.timeline({ scrollTrigger: { trigger: mc, start: "top 92%", end: "top 30%", scrub: true } })
        .fromTo(box, { clipPath: "inset(12% 12% 12% 12%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out" }, 0)
        .fromTo(img, { scale: 1.06 }, { scale: 1, ease: "power2.out" }, 0);
      gsap.fromTo(mc, { yPercent: speed * .2 }, {
        yPercent: -speed * .2, ease: "none",
        scrollTrigger: { trigger: mc, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    ScrollTrigger.create({ trigger: ".macro", start: "top center", end: "bottom center",
      onToggle: (st) => st.isActive && setSlate("slate.macro", "cam.macro") });

    /* ---------- 04b INTERIOR: masks open as each frame arrives ---------- */
    $$(".ic").forEach((ic) => {
      gsap.timeline({ scrollTrigger: { trigger: ic, start: "top 92%", end: "top 40%", scrub: true } })
        .fromTo($(".ic__img", ic), { clipPath: "inset(10% 10% 10% 10%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out" }, 0)
        .fromTo($("img", ic), { scale: 1.06 }, { scale: 1, ease: "power2.out" }, 0);
    });
    ScrollTrigger.create({ trigger: ".interior", start: "top center", end: "bottom center",
      onToggle: (st) => st.isActive && setSlate("slate.interior", "cam.interior") });

    /* ---------- 05 SERVICES ---------- */
    $$(".svc").forEach((svc) => {
      gsap.from(svc.children, {
        y: 40, opacity: 0, duration: 1.1, ease: "power3.out", stagger: .12,
        scrollTrigger: { trigger: svc, start: "top 85%", once: true },
      });
      gsap.fromTo($("img", svc), { yPercent: -2 }, { yPercent: 2, ease: "none",
        scrollTrigger: { trigger: svc, start: "top bottom", end: "bottom top", scrub: true } });
    });
    ScrollTrigger.create({ trigger: ".services", start: "top center", end: "bottom center",
      onToggle: (st) => st.isActive && setSlate("slate.bay", "cam.various") });

    /* ---------- 06 BOOK ---------- */
    ScrollTrigger.create({ trigger: ".book", start: "top 70%", end: "bottom top",
      onToggle: (st) => st.isActive && setSlate("6872165", "cam.book") });
    gsap.fromTo(".book__bg", { scale: 1.03 }, { scale: 1, ease: "none",
      scrollTrigger: { trigger: ".book", start: "top bottom", end: "bottom bottom", scrub: true } });
    gsap.from(".book .display", { yPercent: 60, opacity: 0, duration: 1.3, ease: "expo.out",
      scrollTrigger: { trigger: ".book .display", start: "top 85%", once: true } });

    /* slate steps aside for the footer copy */
    ScrollTrigger.create({ trigger: ".foot", start: "top bottom-=40", end: "max",
      onToggle: (st) => gsap.to("#slate", { autoAlpha: st.isActive ? 0 : 1, duration: .3 }) });

    /* ---------- contact details + booking (from js/config.js) ---------- */
    const cfg = window.AUTOLAB_CONFIG || {};
    const val = (k) => String(cfg[k] || "").trim();
    const digits = (v) => v.replace(/[^\d]/g, "");
    const esc = (v) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const link = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}</a>`;

    // only filled-in fields are shown; nothing is invented
    const tg = val("telegram").replace(/^@/, "");
    const tgIsPhone = /^\+?\d[\d\s-]{6,}$/.test(tg);
    function renderContacts() {
      const rows = [];
      if (val("phone")) rows.push(["c.phone", `<a href="tel:${esc(val("phone").replace(/[^\d+]/g, ""))}">${esc(val("phone"))}</a>`]);
      if (val("whatsapp")) rows.push(["c.whatsapp", link(`https://wa.me/${digits(val("whatsapp"))}`, val("phone") && digits(val("phone")) === digits(val("whatsapp")) ? val("phone") : "+" + digits(val("whatsapp")))]);
      if (tg) rows.push(["c.telegram", tgIsPhone
        ? link(`https://t.me/+${digits(tg)}`, val("phone") && digits(val("phone")) === digits(tg) ? val("phone") : "+" + digits(tg))
        : link(`https://t.me/${tg}`, "@" + tg)]);
      if (val("email")) rows.push(["c.email", `<a href="mailto:${esc(val("email"))}">${esc(val("email"))}</a>`]);
      if (val("address")) rows.push(["c.address", esc(val("address")) + (val("mapUrl") ? "<br>" + link(val("mapUrl"), t("c.map")) : "")]);
      else if (val("mapUrl")) rows.push(["c.address", link(val("mapUrl"), t("c.map"))]);
      if (val("hours")) rows.push(["c.hours", esc(val("hours"))]);
      if (val("instagram")) rows.push(["c.instagram", link(`https://instagram.com/${val("instagram").replace(/^@/, "")}`, "@" + val("instagram").replace(/^@/, ""))]);
      if (rows.length) {
        $("#contactList").innerHTML = rows.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${v}</dd></div>`).join("");
        $("#contact").hidden = false;
      }
    }

    // where a booking request goes: a form service, else WhatsApp, else email, else nowhere (and we say so)
    const channel = val("formEndpoint") ? "endpoint" : val("whatsapp") ? "whatsapp" : val("email") ? "email" : "none";
    const form = $("#bookForm"), note = $("#formNote"), btn = $("#bookBtn");
    const dateIn = $("#fDate");
    try { dateIn.min = new Date().toISOString().slice(0, 10); } catch (e) { /* older browsers: no minimum */ }
    let noteState = ["intro"];
    function renderNote() {
      const [kind, a] = noteState;
      if (kind === "intro") note.textContent = t({ endpoint: "note.endpoint", whatsapp: "note.wa", email: "note.email", none: "note.none" }[channel]);
      else if (kind === "ready") note.innerHTML = esc(t("note.ready", { app: t(channel === "whatsapp" ? "app.wa" : "app.email") }))
        .replace("&lt;a&gt;", `<a href="${esc(a)}" target="_blank" rel="noopener">`).replace("&lt;/a&gt;", "</a>");
      else note.textContent = t(kind, a ? { name: a } : undefined);
      btn.textContent = t(channel === "whatsapp" ? "btn.wa" : channel === "email" ? "btn.email" : "btn.request");
    }
    const say = (kind, a) => { noteState = [kind, a]; renderNote(); };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      $$("input[required]", form).forEach((i) => {
        const bad = !i.value.trim();
        i.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      if (!ok) { say("note.invalid"); return; }
      const d = Object.fromEntries(new FormData(form));
      const name = String(d.name).trim();
      const text = [t("msg.title"), `${t("msg.name")}: ${name}`, `${t("msg.car")}: ${d.car}`, `${t("msg.svc")}: ${d.service}`,
        `${t("msg.date")}: ${d.date || t("msg.any")}`, `${t("msg.contact")}: ${d.contact}`].join("\n");

      if (channel === "endpoint") {
        btn.disabled = true; say("note.sending");
        try {
          const r = await fetch(val("formEndpoint"), { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
          if (!r.ok) throw new Error(r.status);
          say("note.sent", name);
          form.reset();
        } catch (err) {
          say("note.failed");
        } finally { btn.disabled = false; }
        return;
      }
      if (channel === "none") { say("note.noneAfter", name); return; }
      const url = channel === "whatsapp"
        ? `https://wa.me/${digits(val("whatsapp"))}?text=${encodeURIComponent(text)}`
        : `mailto:${val("email")}?subject=${encodeURIComponent(t("msg.subject") + ": " + d.service)}&body=${encodeURIComponent(text)}`;
      // the visitor still has to press send in WhatsApp or their mail app, so the page never claims it was sent
      say("ready", url);
      if (channel === "whatsapp") window.open(url, "_blank", "noopener");
      else window.location.href = url;
    });

    renderContacts(); renderNote();
    document.addEventListener("autolab:lang", () => {
      renderContacts(); renderNote(); setSlate(...slateNow);
      ScrollTrigger.refresh();
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

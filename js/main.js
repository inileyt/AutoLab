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
  const slate = { photo: $("#slReel"), cam: $("#slCam") };
  function setSlate(photo, cam) {
    photo = String(photo);
    if (slate.photo.textContent !== photo) slate.photo.textContent = photo;
    if (slate.cam.textContent !== cam) slate.cam.textContent = cam;
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
            life: leaving ? 2.6 : 2, alpha: leaving ? .26 : .14,
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
        size: r.width * (i === 0 ? 0.075 : 0.06), life: 2.8, alpha: .28,
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
          lastP = p;
        },
        onEnterBack: () => setSlate("6872163", "30° front right"),
      },
    });
    if (!reduceMotion) {
      heroTl
        .to(".hero__copy .eyebrow, .hero__foot", { opacity: 0, y: -20, duration: .1 }, .02)
        .to(car, { x: () => window.innerWidth * 0.5 + car.offsetWidth * 1.05, duration: .5, ease: "power2.in" }, EXIT_AT)
        .to("#heroWord", { letterSpacing: "0.1em", duration: .35, ease: "power1.inOut" }, .5)
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
        onEnter: () => setSlate("6873074", "0° head-on"),
        onEnterBack: () => setSlate("6873074", "0° head-on"),
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

    /* ---------- 03 PROCESS ---------- */
    const layers = $$(".layer"), steps = $$("#steps li"), caps = $$(".cap");
    const wipe = $("#wipe"), railFill = $("#railFill");
    const N = layers.length;
    let active = -1;
    function setActive(k) {
      if (k === active) return;
      active = k;
      steps.forEach((li, i) => li.classList.toggle("is-on", i === k));
      caps.forEach((c, i) => c.classList.toggle("is-on", i === k));
    }
    const procTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: ".process", start: "top top", end: () => "+=" + (N * 125) + "%", scrub: 0.6, pin: true, anticipatePin: 1,
        onUpdate: (st) => {
          const t = st.progress * N;
          const k = Math.min(N - 1, Math.max(0, Math.floor(t + 0.12)));
          setActive(k);
          railFill.style.transform = `scaleX(${st.progress})`;
          setSlate(layers[k].dataset.reel, layers[k].dataset.cam);
        },
        onLeaveBack: () => { active = -1; },
        onEnterBack: () => { active = -1; },
      },
    });
    layers.forEach((l, k) => {
      const kb = $(".kb", l);
      if (kb) procTl.fromTo(kb, { scale: 1.04 }, { scale: 1.0, duration: 1.4 }, Math.max(0, k - .35));
    });
    for (let k = 1; k < N; k++) {
      const at = k - .38;
      procTl
        .fromTo(layers[k], { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: .38, ease: "power2.inOut" }, at)
        .fromTo(wipe, { top: "0%", opacity: 1 }, { top: "100%", duration: .38, ease: "power2.inOut", immediateRender: false }, at)
        .to(wipe, { opacity: 0, duration: .04 }, at + .38)
        .to(layers[k - 1], { opacity: .5, duration: .38, ease: "power2.in" }, at)
        .set(layers[k - 1], { opacity: 1 }, at + .4);
    }
    procTl.to({}, { duration: N - procTl.duration() > 0 ? N - procTl.duration() : .01 });

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
      onToggle: (st) => st.isActive && setSlate("Macro set", "20 cm") });

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
      onToggle: (st) => st.isActive && setSlate("Bay 01 set", "Various") });

    /* ---------- 06 BOOK ---------- */
    ScrollTrigger.create({ trigger: ".book", start: "top 70%", end: "bottom top",
      onToggle: (st) => st.isActive && setSlate("6872165", "Rear, tail light") });
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
    const rows = [];
    if (val("phone")) rows.push(["Phone", `<a href="tel:${esc(val("phone").replace(/[^\d+]/g, ""))}">${esc(val("phone"))}</a>`]);
    if (val("whatsapp")) rows.push(["WhatsApp", link(`https://wa.me/${digits(val("whatsapp"))}`, "+" + digits(val("whatsapp")))]);
    if (val("telegram")) rows.push(["Telegram", link(`https://t.me/${val("telegram").replace(/^@/, "")}`, "@" + val("telegram").replace(/^@/, ""))]);
    if (val("email")) rows.push(["Email", `<a href="mailto:${esc(val("email"))}">${esc(val("email"))}</a>`]);
    if (val("address")) rows.push(["Address", esc(val("address")) + (val("mapUrl") ? "<br>" + link(val("mapUrl"), "Open map") : "")]);
    else if (val("mapUrl")) rows.push(["Map", link(val("mapUrl"), "Open map")]);
    if (val("hours")) rows.push(["Hours", esc(val("hours"))]);
    if (val("instagram")) rows.push(["Instagram", link(`https://instagram.com/${val("instagram").replace(/^@/, "")}`, "@" + val("instagram").replace(/^@/, ""))]);
    if (rows.length) {
      $("#contactList").innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
      $("#contact").hidden = false;
    }

    // where a booking request goes: a form service, else WhatsApp, else email, else nowhere (and we say so)
    const channel = val("formEndpoint") ? "endpoint" : val("whatsapp") ? "whatsapp" : val("email") ? "email" : "none";
    const form = $("#bookForm"), note = $("#formNote"), btn = $("#bookBtn");
    const dateIn = $("#fDate");
    try { dateIn.min = new Date().toISOString().slice(0, 10); } catch (e) { /* older browsers: no minimum */ }
    note.textContent = {
      endpoint: "Your request goes straight to the studio. We reply to confirm the time.",
      whatsapp: "Sending opens WhatsApp with your request filled in. Press send there to book.",
      email: "Sending opens your email app with your request filled in. Press send there to book.",
      none: "Online booking is not connected yet. Requests are not sent anywhere.",
    }[channel];
    if (channel === "whatsapp") btn.textContent = "Send via WhatsApp";
    if (channel === "email") btn.textContent = "Send by email";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let ok = true;
      $$("input[required]", form).forEach((i) => {
        const bad = !i.value.trim();
        i.setAttribute("aria-invalid", bad ? "true" : "false");
        if (bad) ok = false;
      });
      if (!ok) { note.textContent = "Fill in your name, car and a way to reach you."; return; }
      const d = Object.fromEntries(new FormData(form));
      const name = String(d.name).trim();
      const text = ["AUTOLAB booking request", `Name: ${name}`, `Car: ${d.car}`, `Service: ${d.service}`,
        `Preferred date: ${d.date || "any"}`, `Contact: ${d.contact}`].join("\n");

      if (channel === "endpoint") {
        btn.disabled = true; note.textContent = "Sending…";
        try {
          const r = await fetch(val("formEndpoint"), { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
          if (!r.ok) throw new Error(r.status);
          note.textContent = `Thanks, ${name}. Your request reached the studio; we will contact you to confirm the time.`;
          form.reset();
        } catch (err) {
          note.textContent = "The request could not be sent. Please try again, or contact the studio directly.";
        } finally { btn.disabled = false; }
        return;
      }
      if (channel === "none") {
        note.textContent = `Thanks, ${name}. Online booking is not connected yet, so this request was not sent anywhere.`;
        return;
      }
      const url = channel === "whatsapp"
        ? `https://wa.me/${digits(val("whatsapp"))}?text=${encodeURIComponent(text)}`
        : `mailto:${val("email")}?subject=${encodeURIComponent("Booking request: " + d.service)}&body=${encodeURIComponent(text)}`;
      // the visitor still has to press send in WhatsApp or their mail app, so the page never claims it was sent
      note.innerHTML = `Your request is ready. If ${channel === "whatsapp" ? "WhatsApp" : "your email app"} did not open, `
        + `<a href="${esc(url)}" target="_blank" rel="noopener">open it here</a>, then press send.`;
      if (channel === "whatsapp") window.open(url, "_blank", "noopener");
      else window.location.href = url;
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* AUTOLAB — tyre smoke. A small canvas particle system: soft white puffs that
   grow, drift up and fade. Pure page graphics; nothing here touches the car photo. */
(function () {
  "use strict";

  function makeSprite(size) {
    // a lumpy, cloud-like puff built from many soft blobs, faded to a round edge
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d");
    const h = size / 2;
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * h * 0.42;
      const x = h + Math.cos(a) * d, y = h + Math.sin(a) * d, r = h * (0.28 + Math.random() * 0.36);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, "rgba(242,244,246,0.11)");
      grd.addColorStop(1, "rgba(242,244,246,0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = "destination-in";
    const edge = g.createRadialGradient(h, h, h * 0.2, h, h, h);
    edge.addColorStop(0, "rgba(0,0,0,1)");
    edge.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = edge; g.fillRect(0, 0, size, size);
    return c;
  }

  class Smoke {
    constructor(canvas, { max = 240 } = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.max = max;
      this.p = [];
      this.sprites = [makeSprite(256), makeSprite(256), makeSprite(256)];
      this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      this.t = 0;
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(canvas);
      this.resize();
    }
    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      this.canvas.width = Math.max(1, Math.round(r.width * this.dpr));
      this.canvas.height = Math.max(1, Math.round(r.height * this.dpr));
    }
    /* x, y in CSS px of the canvas; o: { n, vx, vy, spread, size, life, alpha } */
    emit(x, y, o = {}) {
      const n = o.n || 1, s = (o.size || 40) * (this.w < 700 ? 0.7 : 1);
      for (let i = 0; i < n; i++) {
        if (this.p.length >= this.max) this.p.shift();
        const sp = o.spread || 40;
        this.p.push({
          x: x + (Math.random() - .5) * sp * .5,
          y: y + (Math.random() - .5) * sp * .25,
          vx: (o.vx || 0) + (Math.random() - .5) * sp,
          vy: (o.vy || -20) + (Math.random() - .7) * sp * .6,
          r: s * (.6 + Math.random() * .8),
          grow: 1.4 + Math.random() * 1.6,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - .5) * .6,
          age: 0,
          life: (o.life || 2.4) * (.7 + Math.random() * .6),
          a: (o.alpha || .55) * (.7 + Math.random() * .5),
          k: (Math.random() * this.sprites.length) | 0,
        });
      }
    }
    get active() { return this.p.length > 0; }
    step(dt) {
      dt = Math.min(dt, 1 / 20);
      this.t += dt;
      const drag = Math.pow(0.18, dt);
      for (let i = this.p.length - 1; i >= 0; i--) {
        const q = this.p[i];
        q.age += dt;
        if (q.age >= q.life) { this.p.splice(i, 1); continue; }
        q.vx *= drag; q.vy = q.vy * drag - 14 * dt;            // slow down, rise
        q.x += (q.vx + Math.sin(this.t * 1.3 + q.rot * 3) * 8) * dt;
        q.y += q.vy * dt;
        q.r += q.r * q.grow * dt * (1 - q.age / q.life) * .9;   // billow, then settle
        q.rot += q.vr * dt;
      }
      this.draw();
    }
    draw() {
      const g = this.ctx, d = this.dpr;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (const q of this.p) {
        const t = q.age / q.life;
        const fade = t < .12 ? t / .12 : 1 - (t - .12) / .88;
        g.globalAlpha = Math.max(0, q.a * fade * fade);
        g.setTransform(d, 0, 0, d, q.x * d, q.y * d);
        g.rotate(q.rot);
        g.drawImage(this.sprites[q.k], -q.r, -q.r, q.r * 2, q.r * 2);
      }
      g.globalAlpha = 1;
    }
    clear() { this.p.length = 0; this.draw(); }
  }

  window.Smoke = Smoke;
})();

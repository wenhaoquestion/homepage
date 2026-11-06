// Cursor build intro. A swarm of glowing cursors sketches frames on an empty
// canvas; the first click (or scroll / key press) sends them to draw the real
// page with marquee selections. Elements build as they enter the viewport and
// reset once they leave it, so scrolling either way keeps the cursors working.
// Cursors fade out as soon as there is nothing left to draw.
//
// Unbuilt elements are hidden with clip-path only, so the page's own opacity and
// transform effects (scroll reveals, title masks, canvas entrance) are untouched;
// their entrance animations are held and played the moment a cursor draws them.
// Without JavaScript, or with reduced motion, the page renders exactly as before.
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('bp-pending')) return;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#6366f1',
    '#d946ef', '#22c55e', '#ef4444', '#0ea5e9', '#a855f7', '#eab308', '#14b8a6', '#f43f5e'];

  // What gets drawn and how its selection is measured:
  // tight = hug the content, box = element box, frame = a container drawn before
  // anything inside it, rule-* = draw that border line.
  const SPEC = [
    ['.wordmark', 'tight'], ['.desktop-nav > a', 'box'], ['.header-tools > .utility-button', 'box'],
    ['.mobile-nav > summary', 'box'], ['.header-inner', 'rule-bottom'], ['.header-tools', 'rule-left'],
    ['#hero-title', 'box'], ['.hero-name', 'tight'], ['.intro', 'tight'], ['.hero-cta', 'box'],
    ['.gravity-canvas-wrap', 'box'], ['.gravity-caption', 'box'], ['.gravity-controls', 'box'],
    ['.gravity-actions', 'tight'],
    ['.at-a-glance', 'rule-top'], ['.at-a-glance > div', 'box'],
    ['.research', 'frame'], ['.contact', 'frame'],
    ['.section-label', 'tight'], ['#about-title', 'tight'], ['.about-copy > p', 'tight'],
    ['.affiliations', 'rule-top'], ['.affiliations > p', 'tight'], ['.affiliations .text-link', 'box'],
    ['#research-title', 'tight'], ['.research-item', 'box'],
    ['#projects-title', 'tight'], ['.section-heading > .text-link', 'box'],
    ['.project-item', 'rule-top'], ['.project-item > summary', 'box'], ['.project-summary', 'tight'],
    ['.cell-study', 'box'], ['.project-figure', 'box'],
    ['#contact-title', 'tight'], ['.contact-links > p', 'tight'], ['.contact-links > a', 'box'],
    ['.footer-bottom', 'rule-top'], ['.footer-bottom > p', 'tight'], ['.footer-bottom > a', 'box'],
  ];

  /* ---------- targets ---------- */

  const header = document.querySelector('.site-header');
  const targets = [];
  const byEl = new Map();
  for (const [selector, mode] of SPEC) {
    document.querySelectorAll(selector).forEach((el) => {
      if (byEl.has(el)) return;
      const t = { el, mode, state: 'idle', owner: null, marquee: null, range: null, frame: null,
        inHeader: !!header && header.contains(el) };
      if (mode === 'tight') {
        t.range = document.createRange();
        t.range.selectNodeContents(el);
      }
      el.classList.add(mode.startsWith('rule') ? 'bp-rule' : 'bp-target');
      targets.push(t);
      byEl.set(el, t);
    });
  }
  for (const t of targets) {
    for (let p = t.el.parentElement; p && p !== document.body; p = p.parentElement) {
      const owner = byEl.get(p);
      if (owner && owner.mode === 'frame') { t.frame = owner; break; }
    }
  }

  let cache = new Map();
  function box(t) {
    let b = cache.get(t);
    if (b === undefined) {
      b = measure(t);
      cache.set(t, b);
    }
    return b;
  }

  function measure(t) {
    const r = t.el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    switch (t.mode) {
      case 'rule-top': return { x: r.left, y: r.top, w: r.width, h: 0, r };
      case 'rule-bottom': return { x: r.left, y: r.bottom - 1, w: r.width, h: 0, r };
      case 'rule-left': return { x: r.left, y: r.top, w: 0, h: r.height, r };
      case 'tight': {
        const q = t.range.getBoundingClientRect();
        if (q.width > 0) return { x: q.left - 4, y: q.top - 3, w: q.width + 10, h: q.height + 6, r };
        break;
      }
      default: break;
    }
    return { x: r.left, y: r.top, w: r.width, h: r.height, r };
  }

  /* ---------- the page's own entrance animations ---------- */

  const HELD = new Set(['title-in', 'fade-in', 'field-in']);
  const held = [];
  if (typeof document.getAnimations === 'function') {
    for (const animation of document.getAnimations()) {
      const el = animation.effect && animation.effect.target;
      if (!el || !HELD.has(animation.animationName)) continue;
      animation.pause();
      animation.currentTime = 0;
      held.push({ animation, el, playing: false });
    }
  }

  function playFor(t) {
    for (const h of held) {
      if (h.playing || !(h.el.contains(t.el) || t.el.contains(h.el))) continue;
      h.playing = true;
      h.animation.currentTime = 0;
      h.animation.play();
    }
  }

  function resetFor(t) {
    for (const h of held) {
      if (!h.playing) continue;
      const inside = t.el.contains(h.el);
      const around = h.el.contains(t.el) && !targets.some((o) => o.state !== 'idle' && h.el.contains(o.el));
      if (!inside && !around) continue;
      h.playing = false;
      h.animation.pause();
      h.animation.currentTime = 0;
    }
  }

  /* ---------- overlay ---------- */

  const layer = document.createElement('div');
  layer.className = 'bp-layer';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('div');
  canvas.className = 'bp-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas, layer);

  // DOM writes are collected during a frame and flushed together after all reads.
  const dirtyBoxes = new Set();
  const clipWrites = new Map();

  function makeBox(color, kind = 'box') {
    const el = document.createElement('div');
    el.className = kind === 'h' ? 'bp-box is-h' : kind === 'v' ? 'bp-box is-v' : 'bp-box';
    el.style.setProperty('--c', color);
    if (kind === 'box') el.style.backgroundColor = `${color}12`;
    el.innerHTML = '<i></i><i></i><i></i><i></i><span class="bp-size"></span>';
    layer.append(el);
    const size = el.lastChild;
    let timer = 0;
    let fading = false;
    return {
      el, x: 0, y: 0, w: 0, h: 0,
      set(x, y, w, h) {
        if (w < 0) { x += w; w = -w; }
        if (h < 0) { y += h; h = -h; }
        this.x = x; this.y = y; this.w = w; this.h = h;
        dirtyBoxes.add(this);
      },
      flush() {
        el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0)`;
        el.style.width = `${this.w}px`;
        el.style.height = `${this.h}px`;
      },
      release() {
        size.textContent = `${Math.max(1, Math.round(this.w))} × ${Math.max(1, Math.round(this.h))}`;
        el.classList.add('is-released');
      },
      // A later call with a shorter delay wins, so the start click clears the canvas at once.
      remove(delay = 0) {
        if (fading) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          fading = true;
          el.classList.add('is-gone');
          setTimeout(() => el.remove(), 360);
        }, delay);
      },
    };
  }

  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2 20 9.4 12.3 12.3 9.4 20Z"/></svg>';

  // The pool grows with the work: one cursor per element waiting to be drawn,
  // split off from the visitor's pointer, and each leaves once it is idle.
  const MAX_CURSORS = innerWidth < 760 ? 14 : 28;
  const cursors = [];
  let colorIndex = 0;

  function makeCursor(x, y, burst = false) {
    const color = COLORS[colorIndex++ % COLORS.length];
    const el = document.createElement('div');
    el.className = 'bp-cursor';
    el.style.setProperty('--c', color);
    el.innerHTML = ARROW;
    layer.append(el);
    const a = rand(0, Math.PI * 2);
    const c = {
      el, color, x, y, px: x, py: y, hx: burst ? Math.cos(a) : 0, hy: burst ? Math.sin(a) : 0,
      op: burst ? 0.9 : 0, speed: rand(0.95, 1.2), side: Math.random() < 0.5 ? -1 : 1,
      gen: null, kind: null, down: false, idleSince: performance.now(), drawn: '',
    };
    cursors.push(c);
    return c;
  }

  let pointer = null; // last known position of the visitor's own pointer
  const touch = matchMedia('(hover: none)').matches;
  const lead = makeCursor(innerWidth / 2, innerHeight / 2 + 90);

  /* ---------- motion (generators stepped once per frame) ---------- */

  let now = performance.now();

  function* wait(ms) {
    const end = now + ms;
    while (now < end) yield;
  }

  function* tween(duration, fn) {
    const start = now;
    for (;;) {
      const k = Math.min(1, (now - start) / duration);
      fn(k);
      if (k >= 1) return;
      yield;
    }
  }

  // Cubic Bézier flight. The first handle continues the cursor's current heading,
  // so consecutive moves join without corners; the second bends the arrival to one
  // side. Handles are recomputed against the live target, which may scroll.
  function* flyTo(c, getPoint, slowness = 1) {
    const sx = c.x;
    const sy = c.y;
    const p0 = getPoint();
    const dist = Math.hypot(p0.x - sx, p0.y - sy);
    if (dist < 2) return;
    const ux = (p0.x - sx) / dist;
    const uy = (p0.y - sy) / dist;
    let hx = c.hx;
    let hy = c.hy;
    if (Math.hypot(hx, hy) < 0.2) {
      const a = rand(-0.9, 0.9);
      hx = ux * Math.cos(a) - uy * Math.sin(a);
      hy = ux * Math.sin(a) + uy * Math.cos(a);
    }
    hx = hx * 0.8 + ux;
    hy = hy * 0.8 + uy;
    const hl = Math.hypot(hx, hy) || 1;
    hx /= hl;
    hy /= hl;
    if (Math.random() < 0.2) c.side = -c.side;
    const reach = rand(0.28, 0.42);
    const bend = c.side * rand(0.12, 0.32);
    const duration = (clamp(190 + dist * 0.4, 230, 680) * slowness) / c.speed;

    yield* tween(duration, (k) => {
      const p = getPoint();
      const t = smooth(k);
      const vx = p.x - sx;
      const vy = p.y - sy;
      const len = Math.hypot(vx, vy);
      const ax = sx + hx * len * reach;
      const ay = sy + hy * len * reach;
      const bx = p.x - vx * 0.32 - vy * bend;
      const by = p.y - vy * 0.32 + vx * bend;
      const m = 1 - t;
      c.x = m * m * m * sx + 3 * m * m * t * ax + 3 * m * t * t * bx + t * t * t * p.x;
      c.y = m * m * m * sy + 3 * m * m * t * ay + 3 * m * t * t * by + t * t * t * p.y;
    });
  }

  /* ---------- build phase ---------- */

  const lingering = [];

  function queueClip(t, b, e) {
    const r = b.r;
    const right = b.x + b.w * e;
    const bottom = b.y + b.h * e;
    clipWrites.set(t, `inset(${b.y - r.top}px ${r.right - right}px ${r.bottom - bottom}px ${b.x - r.left}px)`);
  }

  function markBuilt(t) {
    clipWrites.set(t, '');
    t.el.classList.remove('bp-drawing');
    t.el.classList.add('bp-built');
    t.state = 'built';
    t.owner = null;
    t.marquee = null;
  }

  function releaseCursor(c) {
    c.gen = null;
    c.kind = null;
    c.down = false;
    c.idleSince = now;
  }

  function unbuild(t) {
    if (t.state === 'claimed' && t.owner) releaseCursor(t.owner);
    if (t.marquee) t.marquee.remove();
    t.marquee = null;
    t.owner = null;
    t.state = 'idle';
    clipWrites.delete(t);
    t.el.classList.remove('bp-built', 'bp-drawing');
    t.el.style.clipPath = '';
    resetFor(t);
  }

  function* build(c, t) {
    t.state = 'claimed';
    t.owner = c;
    yield* flyTo(c, () => {
      const b = box(t);
      return b ? { x: b.x, y: b.y } : { x: c.x, y: c.y };
    });

    let b = box(t);
    if (!b) { markBuilt(t); return; }
    const kind = t.mode === 'rule-left' ? 'v' : t.mode.startsWith('rule') ? 'h' : 'box';
    const m = makeBox(c.color, kind);
    t.marquee = m;
    m.set(b.x, b.y, 0, 0);
    c.down = true;
    yield* wait(24);

    if (kind === 'box') {
      t.el.classList.add('bp-drawing');
      playFor(t);
    }
    const duration = clamp(190 + Math.hypot(b.w, b.h) * 0.3, 240, 640) / c.speed;
    yield* tween(duration, (k) => {
      const e = smooth(k);
      b = box(t) || b;
      c.x = b.x + b.w * e;
      c.y = b.y + b.h * e;
      m.set(b.x, b.y, b.w * e, b.h * e);
      if (kind === 'box') queueClip(t, b, e);
    });

    c.down = false;
    markBuilt(t);
    m.release();
    lingering.push({ m, t, fadeAt: now + 300, endAt: now + 680 });
    yield* wait(rand(8, 40));
  }

  /* ---------- main loop ---------- */

  let started = false;
  let canvasDone = false;
  let scrollDir = 1;
  let lastY = scrollY;
  let raf = 0;

  function wake() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame(ts) {
    raf = 0;
    const dt = clamp(ts - now, 1, 64);
    now = ts;
    cache = new Map();
    updateVisibility();

    const pending = [];
    let waiting = 0;
    let claimed = 0;
    if (started) {
      for (const t of targets) {
        if (t.state === 'pending') {
          waiting++;
          if (t.frame && t.frame.state !== 'built') continue; // draw the container first
          const b = box(t);
          if (b) pending.push({ t, b });
          else markBuilt(t);
        } else if (t.state === 'claimed') claimed++;
      }
    }

    let busy = waiting > 0 || claimed > 0 || lingering.length > 0;

    if (started && pending.length) {
      let free = 0;
      for (const c of cursors) if (c.kind !== 'build') free++;
      const origin = spawnPoint();
      for (let n = pending.length - free; n > 0 && cursors.length < MAX_CURSORS; n--) {
        makeCursor(origin.x, origin.y, true);
      }
    }

    for (const c of cursors) {
      if (started && c.kind !== 'build' && pending.length) {
        let best = 0;
        let bestScore = Infinity;
        pending.forEach(({ b }, i) => {
          const order = scrollDir >= 0 ? b.y : innerHeight - (b.y + b.h);
          const score = order * 0.6 + Math.hypot(b.x - c.x, b.y - c.y) * 0.4;
          if (score < bestScore) { bestScore = score; best = i; }
        });
        const { t } = pending.splice(best, 1)[0];
        c.gen = build(c, t);
        c.kind = 'build';
        c.down = false;
      }
      if (c.gen && c.gen.next().done) releaseCursor(c);

      const mx = c.x - c.px;
      const my = c.y - c.py;
      const moved = Math.hypot(mx, my);
      if (moved > 0.4) {
        const a = 1 - Math.exp(-dt / 70);
        c.hx += (mx / moved - c.hx) * a;
        c.hy += (my / moved - c.hy) * a;
      }
      c.px = c.x;
      c.py = c.y;

      // Before the start only the lead shows, on the visitor's pointer; afterwards
      // idle cursors leave as soon as there is nothing to draw.
      const goal = !started ? (pointer || touch ? 1 : 0) : c.kind || now - c.idleSince < 60 ? 1 : 0;
      c.op += (goal - c.op) * (1 - Math.exp(-dt / (goal ? 70 : 150)));
      if (Math.abs(goal - c.op) < 0.004) c.op = goal;
      if (c.gen || (started && c.op > 0) || Math.abs(goal - c.op) > 0) busy = true;
    }

    for (let i = cursors.length - 1; i >= 0; i--) {
      const c = cursors[i];
      if (started && !c.gen && c.op === 0) {
        c.el.remove();
        cursors.splice(i, 1);
      }
    }

    for (let i = lingering.length - 1; i >= 0; i--) {
      const item = lingering[i];
      const b = item.t.state === 'built' ? box(item.t) : null;
      if (b) item.m.set(b.x, b.y, b.w, b.h);
      if (!b || now > item.fadeAt) item.m.remove();
      if (!b || now > item.endAt) lingering.splice(i, 1);
    }

    dirtyBoxes.forEach((m) => m.flush());
    dirtyBoxes.clear();
    clipWrites.forEach((value, t) => { t.el.style.clipPath = value; });
    clipWrites.clear();
    for (const c of cursors) {
      const drawn = `${c.x.toFixed(2)},${c.y.toFixed(2)},${c.op.toFixed(3)},${c.down}`;
      if (drawn === c.drawn) continue;
      c.drawn = drawn;
      c.el.style.transform = `translate3d(${c.x - 3}px, ${c.y - 2}px, 0)`;
      c.el.style.opacity = c.op;
      c.el.classList.toggle('is-down', c.down);
    }

    if (started && !canvasDone && !waiting && !claimed) {
      canvasDone = true;
      setTimeout(() => canvas.classList.add('is-done'), 400);
    }

    if (busy) wake();
  }

  /* ---------- visibility ---------- */

  // Measured directly each frame: IntersectionObserver would count an element as
  // gone while its own clip-path is still empty at the start of a drag.
  function updateVisibility() {
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    for (const t of targets) {
      const b = box(t);
      const r = b && b.r;
      const top = t.inHeader ? 0 : headerBottom;
      const visible = !!r && r.bottom > top && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      if (visible) {
        if (t.state === 'idle') t.state = 'pending';
      } else if (t.state !== 'idle') {
        unbuild(t);
      }
    }
  }

  addEventListener('resize', wake, { passive: true });
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y !== lastY) scrollDir = y > lastY ? 1 : -1;
    lastY = y;
    wake();
  }, { passive: true });

  // Opened disclosures show their content at once rather than waiting for a cursor.
  document.addEventListener('toggle', (event) => {
    const details = event.target;
    if (!started || !(details instanceof HTMLDetailsElement) || !details.open) return;
    for (const t of targets) {
      if (t.el === details || !details.contains(t.el) || t.state === 'built') continue;
      if (t.owner) releaseCursor(t.owner);
      if (t.marquee) t.marquee.remove();
      markBuilt(t);
      playFor(t);
    }
    wake();
  }, true);

  /* ---------- start ---------- */

  const chinese = root.lang === 'zh-CN';
  const hint = chinese ? `${touch ? '轻点' : '点击'}任意位置，开始构建` : `${touch ? 'Tap' : 'Click'} anywhere to build`;
  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'bp-start';
  startButton.setAttribute('aria-label', chinese ? '开始构建页面' : 'Start building the page');
  startButton.innerHTML = `<span class="bp-intro"><span class="bp-title">${chinese ? '黄文瑀' : 'WENYU HUANG'}<span>.</span></span><span class="bp-hint"><span class="bp-pulse"></span>${hint}</span></span>`;
  document.body.append(startButton);

  function ripple(x, y) {
    const el = document.createElement('span');
    el.className = 'bp-ripple';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    layer.append(el);
    setTimeout(() => el.remove(), 900);
  }

  function spawnPoint() {
    if (pointer) return pointer;
    return { x: lead.x, y: lead.y };
  }

  function start(event) {
    if (started) return;
    started = true;
    const touchPoint = event && event.touches && event.touches[0];
    if (touchPoint) pointer = { x: touchPoint.clientX, y: touchPoint.clientY };
    else if (event && typeof event.clientX === 'number' && (event.clientX || event.clientY)) {
      pointer = { x: event.clientX, y: event.clientY };
    }
    const origin = spawnPoint();
    lead.x = lead.px = origin.x;
    lead.y = lead.py = origin.y;
    lead.op = 1;
    ripple(origin.x, origin.y);
    startButton.classList.add('is-gone');
    setTimeout(() => startButton.remove(), 500);
    cursors.forEach(releaseCursor);
    removeEventListener('wheel', start);
    removeEventListener('touchmove', start);
    removeEventListener('keydown', onKey);
    wake();
  }

  function onKey(event) {
    if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) start();
  }

  function trackPointer(event) {
    pointer = { x: event.clientX, y: event.clientY };
    if (!started) {
      lead.x = pointer.x;
      lead.y = pointer.y;
      wake();
    }
  }

  addEventListener('pointermove', trackPointer, { passive: true });
  addEventListener('pointerdown', trackPointer, { passive: true });
  startButton.addEventListener('click', start);
  addEventListener('wheel', start, { passive: true });
  addEventListener('touchmove', start, { passive: true });
  addEventListener('keydown', onKey);

  root.classList.add('bp-ready');
  root.classList.remove('bp-pending');
  wake();
})();

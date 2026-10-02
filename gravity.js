// A small, real gravity simulation: softened inverse-square attraction,
// integrated with fixed-step velocity Verlet. Canvas is decorative; controls are HTML.
(() => {
  'use strict';

  const canvas = document.querySelector('#gravity-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const study = canvas.closest('.gravity-study') || canvas;
  const toggle = document.querySelector('#gravity-toggle');
  const toggleLabel = toggle?.querySelector('[data-gravity-toggle-label]');
  const strengthInput = document.querySelector('#gravity-strength');
  const strengthOutput = document.querySelector('#gravity-strength-value');
  const launchButton = document.querySelector('#gravity-launch');
  const resetButton = document.querySelector('#gravity-reset');
  const hint = document.querySelector('#gravity-hint');
  const status = document.querySelector('#gravity-status');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

  const STEP = 1 / 120;
  const SUN_RADIUS = 0.11;
  const SOFTENING_SQUARED = 0.018 ** 2;
  const MAX_PARTICLES = 32;
  const TRAIL_LENGTH = 180;
  const palette = { paper: '#f5f5f2', ink: '#181918', accent: '#ed3d23' };
  const particles = [];
  const ripples = [];
  let width = 1;
  let height = 1;
  let size = 1;
  let offsetX = 0;
  let offsetY = 0;
  let drawable = false;
  let visible = true;
  let paused = motionPreference.matches;
  let strength = Math.max(0.3, Math.min(2, Number(strengthInput?.value) || 1));
  let frame = 0;
  let lastTime = 0;
  let accumulator = 0;
  let stepNumber = 0;
  let launchNumber = 0;
  let drag = null;

  const chinese = () => document.documentElement.lang === 'zh-CN';
  const gravity = () => 0.027 * strength;
  const canAnimate = () => !paused && visible && drawable && !document.hidden;

  function announce(english, translated) {
    if (status) status.textContent = chinese() ? translated : english;
  }

  function readPalette() {
    const styles = window.getComputedStyle(document.documentElement);
    palette.paper = styles.getPropertyValue('--paper').trim() || '#f5f5f2';
    palette.ink = styles.getPropertyValue('--ink').trim() || '#181918';
    palette.accent = styles.getPropertyValue('--accent').trim() || '#ed3d23';
  }

  function acceleration(x, y) {
    const dx = 0.5 - x;
    const dy = 0.5 - y;
    const factor = gravity() / ((dx * dx + dy * dy + SOFTENING_SQUARED) ** 1.5);
    return { x: dx * factor, y: dy * factor };
  }

  function integrate(particle, delta) {
    const before = acceleration(particle.x, particle.y);
    particle.x += particle.vx * delta + before.x * delta * delta * 0.5;
    particle.y += particle.vy * delta + before.y * delta * delta * 0.5;
    const after = acceleration(particle.x, particle.y);
    particle.vx += (before.x + after.x) * delta * 0.5;
    particle.vy += (before.y + after.y) * delta * 0.5;
  }

  function makeOrbit(index) {
    const semiMajor = 0.196 + (index % 8) * 0.026;
    const eccentricity = [0.07, 0.2, 0.12, 0.28, 0.18, 0.22, 0.1, 0.25][index % 8];
    const anomaly = index * 2.399963 + 0.4;
    const rotation = index * 0.63 - 0.38;
    const sine = Math.sin(rotation);
    const cosine = Math.cos(rotation);
    const minorRatio = Math.sqrt(1 - eccentricity * eccentricity);
    const localX = semiMajor * (Math.cos(anomaly) - eccentricity);
    const localY = semiMajor * minorRatio * Math.sin(anomaly);
    const radius = semiMajor * (1 - eccentricity * Math.cos(anomaly));
    const speed = Math.sqrt(gravity() * semiMajor) / radius;
    const localVX = -speed * Math.sin(anomaly);
    const localVY = speed * minorRatio * Math.cos(anomaly);
    return {
      x: 0.5 + localX * cosine - localY * sine,
      y: 0.5 + localX * sine + localY * cosine,
      vx: localVX * cosine - localVY * sine,
      vy: localVX * sine + localVY * cosine,
      trail: [],
      fresh: false,
    };
  }

  function seedTrail(particle) {
    const history = { ...particle };
    const trail = [];
    for (let sample = 0; sample < TRAIL_LENGTH; sample += 1) {
      trail.push({ x: history.x, y: history.y });
      // The opening image is a simulation history, not a prescribed orbit path.
      for (let step = 0; step < 3; step += 1) integrate(history, -STEP);
    }
    particle.trail = trail.reverse();
  }

  function reset() {
    particles.length = 0;
    ripples.length = 0;
    accumulator = 0;
    stepNumber = 0;
    launchNumber = 0;
    drag = null;
    for (let index = 0; index < 8; index += 1) {
      const particle = makeOrbit(index);
      seedTrail(particle);
      particles.push(particle);
    }
    draw();
  }

  function advance() {
    stepNumber += 1;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      integrate(particle, STEP);
      const radius = Math.hypot(particle.x - 0.5, particle.y - 0.5);
      if (radius <= SUN_RADIUS || radius > 1.8 || !Number.isFinite(radius)) {
        if (radius <= SUN_RADIUS) ripples.push({ age: 0 });
        particles.splice(index, 1);
        continue;
      }
      if (stepNumber % 3 === 0) {
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > TRAIL_LENGTH) particle.trail.shift();
      }
    }
    for (let index = ripples.length - 1; index >= 0; index -= 1) {
      ripples[index].age += STEP;
      if (ripples[index].age > 0.48) ripples.splice(index, 1);
    }
  }

  function drawTrail(particle) {
    const trail = particle.trail;
    if (trail.length < 2) return;
    const chunkLength = 20;
    context.strokeStyle = palette.ink;
    context.lineWidth = (particle.fresh ? 0.9 : 0.7) / size;
    for (let start = 0; start < trail.length - 1; start += chunkLength) {
      const end = Math.min(start + chunkLength, trail.length - 1);
      context.globalAlpha = 0.035 + 0.4 * ((end / trail.length) ** 1.7);
      context.beginPath();
      context.moveTo(trail[start].x, trail[start].y);
      for (let index = start + 1; index <= end; index += 1) {
        context.lineTo(trail[index].x, trail[index].y);
      }
      context.stroke();
    }
    const last = trail[trail.length - 1];
    context.globalAlpha = 0.48;
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.lineTo(particle.x, particle.y);
    context.stroke();
  }

  function draw() {
    if (!drawable) return;
    context.globalAlpha = 1;
    context.fillStyle = palette.paper;
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(offsetX, offsetY);
    context.scale(size, size);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    for (const particle of particles) drawTrail(particle);

    context.globalAlpha = 1;
    context.fillStyle = palette.accent;
    context.beginPath();
    context.arc(0.5, 0.5, SUN_RADIUS, 0, Math.PI * 2);
    context.fill();

    for (const ripple of ripples) {
      context.strokeStyle = palette.accent;
      context.lineWidth = 1 / size;
      context.globalAlpha = (1 - ripple.age / 0.48) * 0.55;
      context.beginPath();
      context.arc(0.5, 0.5, SUN_RADIUS + ripple.age * 0.1, 0, Math.PI * 2);
      context.stroke();
    }

    context.globalAlpha = 1;
    context.fillStyle = palette.ink;
    for (const particle of particles) {
      context.beginPath();
      context.arc(particle.x, particle.y, (particle.fresh ? 2.6 : 2.05) / size, 0, Math.PI * 2);
      context.fill();
    }

    if (drag) {
      const end = drag.current;
      const angle = Math.atan2(end.y - drag.start.y, end.x - drag.start.x);
      context.strokeStyle = palette.accent;
      context.fillStyle = palette.accent;
      context.lineWidth = 1.3 / size;
      context.beginPath();
      context.arc(drag.start.x, drag.start.y, 3 / size, 0, Math.PI * 2);
      context.fill();
      if (Math.hypot(end.x - drag.start.x, end.y - drag.start.y) * size > 5) {
        context.beginPath();
        context.moveTo(drag.start.x, drag.start.y);
        context.lineTo(end.x, end.y);
        context.moveTo(end.x - Math.cos(angle - 0.5) * 9 / size, end.y - Math.sin(angle - 0.5) * 9 / size);
        context.lineTo(end.x, end.y);
        context.lineTo(end.x - Math.cos(angle + 0.5) * 9 / size, end.y - Math.sin(angle + 0.5) * 9 / size);
        context.stroke();
      }
    }
    context.restore();
  }

  function animate(now) {
    frame = 0;
    if (!canAnimate()) {
      lastTime = 0;
      return;
    }
    if (lastTime) accumulator += Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    while (accumulator >= STEP) {
      advance();
      accumulator -= STEP;
    }
    draw();
    frame = window.requestAnimationFrame(animate);
  }

  function schedule() {
    if (canAnimate()) {
      if (!frame) frame = window.requestAnimationFrame(animate);
    } else {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      accumulator = 0;
    }
  }

  function updateStrengthLabel() {
    if (strengthOutput) strengthOutput.textContent = `${strength.toFixed(2)}×`;
    strengthInput?.setAttribute('aria-valuetext', chinese()
      ? `引力强度 ${strength.toFixed(2)} 倍`
      : `${strength.toFixed(2)} times gravity`);
  }

  function updateControls() {
    if (toggle) {
      toggle.disabled = false;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused
        ? chinese() ? '播放引力模拟' : 'Play gravity simulation'
        : chinese() ? '暂停引力模拟' : 'Pause gravity simulation');
      const label = paused ? chinese() ? '播放' : 'Play' : chinese() ? '暂停' : 'Pause';
      if (toggleLabel) toggleLabel.textContent = label;
      else toggle.textContent = label;
    }
    if (hint) hint.textContent = paused
      ? chinese() ? '引力实验场 — 已暂停，仍可添加粒子' : 'Gravity playground — Paused; add a probe'
      : chinese() ? '引力实验场 — 拖动发射粒子' : 'Gravity playground — Drag to launch';
    study.dataset.motion = paused ? 'paused' : 'playing';
    updateStrengthLabel();
  }

  function addProbe(particle) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particle.trail = [{ x: particle.x, y: particle.y }];
    particle.fresh = true;
    particles.push(particle);
    draw();
    announce(paused ? 'Probe added. Press Play to run.' : 'Probe launched.',
      paused ? '粒子已添加。点击播放，开始模拟。' : '粒子已发射。');
  }

  function launchAt(start, end, dragged) {
    let vx;
    let vy;
    if (dragged) {
      vx = (end.x - start.x) * 2.2;
      vy = (end.y - start.y) * 2.2;
      const magnitude = Math.hypot(vx, vy);
      if (magnitude > 1.2) {
        vx *= 1.2 / magnitude;
        vy *= 1.2 / magnitude;
      }
    } else {
      const dx = start.x - 0.5;
      const dy = start.y - 0.5;
      const radius = Math.hypot(dx, dy);
      const speed = Math.sqrt(gravity() / radius);
      vx = -dy / radius * speed;
      vy = dx / radius * speed;
    }
    addProbe({ x: start.x, y: start.y, vx, vy });
  }

  function eventPoint(event, bounds) {
    return {
      x: (event.clientX - bounds.left - offsetX) / size,
      y: (event.clientY - bounds.top - offsetY) / size,
    };
  }

  function safeOrigin(point) {
    const dx = point.x - 0.5;
    const dy = point.y - 0.5;
    const radius = Math.hypot(dx, dy);
    const angle = radius > 0.001 ? Math.atan2(dy, dx) : -Math.PI / 4;
    const distance = Math.max(SUN_RADIUS + 0.035, Math.min(radius, 0.48));
    return { x: 0.5 + Math.cos(angle) * distance, y: 0.5 + Math.sin(angle) * distance };
  }

  // Vertical touch gestures remain available for ordinary page scrolling.
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (event) => {
    if (!drawable || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const bounds = canvas.getBoundingClientRect();
    const point = eventPoint(event, bounds);
    const start = safeOrigin(point);
    drag = { id: event.pointerId, bounds, start, current: start, pointerStart: point };
    canvas.setPointerCapture(event.pointerId);
    draw();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const point = eventPoint(event, drag.bounds);
    drag.current = {
      x: drag.start.x + point.x - drag.pointerStart.x,
      y: drag.start.y + point.y - drag.pointerStart.y,
    };
    if (paused) draw();
  }, { passive: true });

  canvas.addEventListener('pointerup', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const gesture = drag;
    const point = eventPoint(event, gesture.bounds);
    const end = {
      x: gesture.start.x + point.x - gesture.pointerStart.x,
      y: gesture.start.y + point.y - gesture.pointerStart.y,
    };
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    launchAt(gesture.start, end, Math.hypot(end.x - gesture.start.x, end.y - gesture.start.y) * size > 6);
  });

  function cancelDrag(event) {
    if (drag && event.pointerId === drag.id) {
      drag = null;
      draw();
    }
  }
  canvas.addEventListener('pointercancel', cancelDrag);
  canvas.addEventListener('lostpointercapture', cancelDrag);

  launchButton?.addEventListener('click', () => {
    launchNumber += 1;
    addProbe(makeOrbit(launchNumber + 3));
  });
  resetButton?.addEventListener('click', () => {
    reset();
    announce('Eight initial orbits restored.', '已恢复八条初始轨道。');
  });
  strengthInput?.addEventListener('input', () => {
    strength = Math.max(0.3, Math.min(2, Number(strengthInput.value) || 1));
    updateStrengthLabel();
    draw();
  });
  toggle?.addEventListener('click', () => {
    paused = !paused;
    updateControls();
    schedule();
  });

  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) paused = true;
    updateControls();
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('themechange', () => {
    readPalette();
    draw();
  });
  window.addEventListener('languagechange', () => {
    updateControls();
    if (status) status.textContent = '';
  });

  function resize(nextWidth, nextHeight) {
    drawable = nextWidth > 0 && nextHeight > 0;
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    size = Math.min(width, height);
    offsetX = (width - size) / 2;
    offsetY = (height - size) / 2;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drag = null;
    draw();
    schedule();
  }

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver((entries) => {
      resize(entries[0].contentRect.width, entries[0].contentRect.height);
    });
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener('resize', () => {
      const bounds = canvas.getBoundingClientRect();
      resize(bounds.width, bounds.height);
    }, { passive: true });
  }
  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      schedule();
    });
    visibilityObserver.observe(canvas);
  }

  readPalette();
  reset();
  const bounds = canvas.getBoundingClientRect();
  resize(bounds.width, bounds.height);
  canvas.dataset.ready = 'true';
  updateControls();
})();

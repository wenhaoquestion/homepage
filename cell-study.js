// Explore saved numerical fields; controls select samples and do not re-solve the model.
(() => {
  'use strict';

  const study = document.querySelector('.cell-study');
  const canvas = document.querySelector('#cell-canvas');
  if (!study || !canvas) return;

  const playButton = document.querySelector('#cell-play');
  const playLabel = playButton?.querySelector('[data-cell-play-label]');
  const resetButton = document.querySelector('#cell-reset');
  const fieldButtons = [...study.querySelectorAll('[data-cell-field]')];
  const timeInput = document.querySelector('#cell-time');
  const timeLabel = document.querySelector('#cell-time-label');
  const fieldLabel = document.querySelector('#cell-field-label');
  const minimumLabel = document.querySelector('#cell-min');
  const maximumLabel = document.querySelector('#cell-max');
  const status = document.querySelector('#cell-status');
  const probeLabel = document.querySelector('#cell-probe');
  const disclosure = study.closest('details');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const context = canvas.getContext('2d');
  const raster = document.createElement('canvas');
  const rasterContext = raster.getContext('2d');
  const colorSample = document.createElement('canvas');
  colorSample.width = 1;
  colorSample.height = 1;
  const colorContext = colorSample.getContext('2d', { willReadFrequently: true });
  const controls = [playButton, resetButton, timeInput, ...fieldButtons].filter(Boolean);

  let loadState = 'idle';
  let data = null;
  let field = 'area';
  let frameIndex = 0;
  let imageData = null;
  let rasterDirty = true;
  let playing = false;
  let visible = false;
  let animationFrame = 0;
  let renderFrame = 0;
  let lastFrameTime = 0;
  let probe = null;
  let cssWidth = 640;
  let cssHeight = 640;
  let plot = { left: 0, top: 0, size: 1 };
  let palette = { paper: '#f5f5f2', ink: '#171715', accent: '#ed3d23' };
  let colorMap = new Uint8ClampedArray(256 * 4);

  const isChinese = () => document.documentElement.lang === 'zh-CN';
  const canPlay = () => loadState === 'ready' && visible && !document.hidden && (!disclosure || disclosure.open);

  function setControlsEnabled(enabled) {
    controls.forEach((control) => { control.disabled = !enabled; });
  }

  function updateLanguage() {
    const chinese = isChinese();
    if (playLabel) playLabel.textContent = playing ? chinese ? '暂停' : 'Pause' : chinese ? '播放' : 'Play';
    if (playButton) {
      playButton.setAttribute('aria-pressed', String(!playing));
      playButton.setAttribute('aria-label', playing
        ? chinese ? '暂停模拟时间线' : 'Pause simulation timeline'
        : chinese ? '播放已保存的模拟状态' : 'Play saved simulation states');
    }
    if (fieldLabel) fieldLabel.textContent = field === 'area'
      ? chinese ? '归一化细胞面积 a/a₀' : 'Normalized cell area a/a₀'
      : chinese ? '肌球蛋白 · 模型单位' : 'Myosin · model units';
    fieldButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.cellField === field)));
    if (status) {
      status.textContent = loadState === 'error'
        ? chinese ? '交互视图暂不可用，已显示保存的模拟图像。' : 'Interactive view unavailable. The saved simulation image is shown.'
        : loadState === 'loading' || loadState === 'idle'
          ? chinese ? '正在加载模拟数据…' : 'Loading simulation data…'
          : playing
            ? chinese ? '正在播放已保存的模拟状态 · 0–15 小时。' : 'Playing saved simulation states · 0–15 hours.'
            : chinese ? '拖动时间线或播放，探索已保存的模拟状态。' : 'Move the timeline or press play to explore saved simulation states.';
    }
    updateTimeLabels();
    updateProbeLabel();
  }

  function updateTimeLabels() {
    if (!data) return;
    const hours = data.times[frameIndex];
    if (timeInput) {
      timeInput.value = String(data.frameCount > 1 ? frameIndex / (data.frameCount - 1) * 100 : 0);
      timeInput.setAttribute('aria-valuetext', isChinese() ? `${hours.toFixed(2)} 小时` : `${hours.toFixed(2)} hours`);
    }
    if (timeLabel) timeLabel.textContent = `${hours.toFixed(2)} ${isChinese() ? '小时' : 'h'}`;
    const selected = data.fields[field];
    if (minimumLabel) minimumLabel.textContent = selected.min.toFixed(2);
    if (maximumLabel) maximumLabel.textContent = selected.max.toFixed(2);
  }

  function valueAt(column, row) {
    const selected = data.fields[field];
    const index = frameIndex * data.width * data.height + row * data.width + column;
    return selected.min + selected.values[index] / 255 * (selected.max - selected.min);
  }

  function updateProbeLabel() {
    if (!probeLabel) return;
    if (!data || !probe) {
      probeLabel.textContent = loadState === 'ready'
        ? isChinese() ? '移动指针，查看局部数值' : 'Move over the field to inspect local values'
        : '';
      return;
    }
    const x = data.xCoordinates[probe.column];
    const y = data.yCoordinates[probe.row];
    const quantity = field === 'area' ? 'a/a₀' : 'm';
    probeLabel.textContent = `x ${x.toFixed(2)}  y ${y.toFixed(2)}  ${quantity} ≈ ${valueAt(probe.column, probe.row).toFixed(3)}`;
  }

  function readColor(value) {
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = value;
    colorContext.fillRect(0, 0, 1, 1);
    return colorContext.getImageData(0, 0, 1, 1).data;
  }

  function updatePalette() {
    if (!colorContext) return;
    const styles = window.getComputedStyle(document.documentElement);
    palette = {
      paper: styles.getPropertyValue('--paper').trim() || '#f5f5f2',
      ink: styles.getPropertyValue('--ink').trim() || '#171715',
      accent: styles.getPropertyValue('--accent').trim() || '#ed3d23',
    };
    const stops = [readColor(palette.paper), readColor(palette.accent), readColor(palette.ink)];
    for (let value = 0; value < 256; value += 1) {
      const position = value / 255 * 2;
      const start = position < 1 ? stops[0] : stops[1];
      const end = position < 1 ? stops[1] : stops[2];
      const weight = position < 1 ? position : position - 1;
      for (let channel = 0; channel < 3; channel += 1) {
        colorMap[value * 4 + channel] = Math.round(start[channel] * (1 - weight) + end[channel] * weight);
      }
      colorMap[value * 4 + 3] = 255;
    }
    rasterDirty = true;
    requestRender();
  }

  function draw() {
    if (!data || !context || !rasterContext) return;
    if (rasterDirty) {
      const values = data.fields[field].values;
      const offset = frameIndex * data.width * data.height;
      for (let cell = 0; cell < data.mask.length; cell += 1) {
        const pixel = cell * 4;
        if (!data.mask[cell]) {
          imageData.data[pixel + 3] = 0;
          continue;
        }
        const color = values[offset + cell] * 4;
        imageData.data[pixel] = colorMap[color];
        imageData.data[pixel + 1] = colorMap[color + 1];
        imageData.data[pixel + 2] = colorMap[color + 2];
        imageData.data[pixel + 3] = 255;
      }
      rasterContext.putImageData(imageData, 0, 0);
      rasterDirty = false;
    }

    context.clearRect(0, 0, cssWidth, cssHeight);
    context.fillStyle = palette.paper;
    context.fillRect(0, 0, cssWidth, cssHeight);
    const padding = Math.max(16, Math.min(cssWidth, cssHeight) * 0.055);
    const size = Math.max(1, Math.min(cssWidth, cssHeight) - padding * 2);
    plot = { left: (cssWidth - size) / 2, top: (cssHeight - size) / 2, size };
    context.imageSmoothingEnabled = true;
    context.drawImage(raster, plot.left, plot.top, size, size);

    // The archived finite-node mask defines the boundary, rather than an ideal circle.
    if (probe) {
      const x = plot.left + (probe.column + 0.5) / data.width * size;
      const y = plot.top + (probe.row + 0.5) / data.height * size;
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.lineWidth = 1.5;
      context.strokeStyle = palette.paper;
      context.stroke();
      context.beginPath();
      context.arc(x, y, 5.5, 0, Math.PI * 2);
      context.lineWidth = 1;
      context.strokeStyle = palette.ink;
      context.stroke();
    }
  }

  function requestRender() {
    if (!renderFrame) renderFrame = window.requestAnimationFrame(() => {
      renderFrame = 0;
      draw();
    });
  }

  function resize() {
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    cssWidth = bounds.width;
    cssHeight = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    requestRender();
  }

  function setFrame(nextFrame) {
    if (!data) return;
    frameIndex = Math.max(0, Math.min(data.frameCount - 1, nextFrame));
    rasterDirty = true;
    updateTimeLabels();
    updateProbeLabel();
    requestRender();
  }

  function animate(now) {
    animationFrame = 0;
    if (!playing || !canPlay()) {
      setPlaying(false);
      return;
    }
    if (!lastFrameTime) lastFrameTime = now;
    const elapsed = now - lastFrameTime;
    if (elapsed >= 100) {
      const steps = Math.floor(elapsed / 100);
      setFrame((frameIndex + steps) % data.frameCount);
      lastFrameTime = now - elapsed % 100;
    }
    animationFrame = window.requestAnimationFrame(animate);
  }

  function setPlaying(nextPlaying) {
    playing = Boolean(nextPlaying && canPlay());
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    lastFrameTime = 0;
    if (playing) animationFrame = window.requestAnimationFrame(animate);
    updateLanguage();
  }

  function decodeBase64(encoded, expectedLength) {
    if (typeof encoded !== 'string') throw new Error('Missing encoded field');
    const binary = window.atob(encoded);
    if (binary.length !== expectedLength) throw new Error('Unexpected simulation field size');
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  function decodeData(source) {
    const { width, height, frameCount, times, xCoordinates, yCoordinates } = source;
    if (!Number.isInteger(width) || width < 2 || width > 512
      || !Number.isInteger(height) || height < 2 || height > 512
      || !Number.isInteger(frameCount) || frameCount < 1 || frameCount > 2000
      || !Array.isArray(times) || times.length !== frameCount
      || times.some((time, index) => !Number.isFinite(time) || (index > 0 && time < times[index - 1]))) {
      throw new Error('Invalid simulation dimensions or times');
    }
    if (!Array.isArray(xCoordinates) || xCoordinates.length !== width || xCoordinates.some((x) => !Number.isFinite(x))
      || !Array.isArray(yCoordinates) || yCoordinates.length !== height || yCoordinates.some((y) => !Number.isFinite(y))) {
      throw new Error('Invalid simulation coordinates');
    }
    const mask = decodeBase64(source.mask, width * height);
    const fields = {};
    for (const name of ['area', 'myosin']) {
      const sourceField = source.fields?.[name];
      if (!sourceField || !Number.isFinite(sourceField.min) || !Number.isFinite(sourceField.max)
        || sourceField.max <= sourceField.min) throw new Error('Invalid simulation value range');
      fields[name] = { ...sourceField, values: decodeBase64(sourceField.data, width * height * frameCount) };
    }
    return { width, height, frameCount, times, xCoordinates, yCoordinates, mask, fields };
  }

  async function loadData() {
    if (loadState !== 'idle' || (disclosure && !disclosure.open)) return;
    if (!context || !rasterContext || !colorContext) {
      loadState = 'error';
      updateLanguage();
      return;
    }
    loadState = 'loading';
    updateLanguage();
    try {
      const response = await window.fetch(new URL('./assets/cell-fields.json', document.baseURI));
      if (!response.ok) throw new Error('Simulation data unavailable');
      data = decodeData(await response.json());
      raster.width = data.width;
      raster.height = data.height;
      imageData = rasterContext.createImageData(data.width, data.height);
      frameIndex = Math.round(Math.min(100, Math.max(0, Number(timeInput?.value) || 0)) / 100 * (data.frameCount - 1));
      resize();
      updatePalette();
      draw();
      loadState = 'ready';
      study.dataset.ready = 'true';
      setControlsEnabled(true);
      updateLanguage();
    } catch (_) {
      data = null;
      loadState = 'error';
      setControlsEnabled(false);
      updateLanguage();
    }
  }

  function checkVisibility() {
    const bounds = study.getBoundingClientRect();
    const expanded = !disclosure || disclosure.open;
    visible = expanded && bounds.height > 0 && bounds.top < window.innerHeight && bounds.bottom > 0;
    if (!visible && playing) setPlaying(false);
    if (expanded && bounds.height > 0 && bounds.top < window.innerHeight + 240 && bounds.bottom > -240) loadData();
  }

  timeInput?.addEventListener('input', () => {
    if (!data) return;
    const nextFrame = Math.round(Number(timeInput.value) / 100 * (data.frameCount - 1));
    setPlaying(false);
    setFrame(nextFrame);
  });
  fieldButtons.forEach((button) => button.addEventListener('click', () => {
    if (!data || !Object.hasOwn(data.fields, button.dataset.cellField)) return;
    field = button.dataset.cellField;
    rasterDirty = true;
    updateLanguage();
    requestRender();
  }));
  playButton?.addEventListener('click', () => {
    checkVisibility();
    setPlaying(!playing);
  });
  resetButton?.addEventListener('click', () => {
    field = 'area';
    probe = null;
    setPlaying(false);
    setFrame(0);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!data) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * cssWidth;
    const y = (event.clientY - bounds.top) / bounds.height * cssHeight;
    const column = Math.floor((x - plot.left) / plot.size * data.width);
    const row = Math.floor((y - plot.top) / plot.size * data.height);
    probe = column >= 0 && column < data.width && row >= 0 && row < data.height && data.mask[row * data.width + column]
      ? { column, row } : null;
    updateProbeLabel();
    requestRender();
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => {
    probe = null;
    updateProbeLabel();
    requestRender();
  }, { passive: true });
  disclosure?.addEventListener('toggle', () => {
    if (!disclosure.open) setPlaying(false);
    else {
      resize();
      checkVisibility();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPlaying(false);
    else checkVisibility();
  });
  reducedMotion.addEventListener('change', () => setPlaying(false));
  window.addEventListener('languagechange', updateLanguage);
  window.addEventListener('themechange', updatePalette);

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    const loadingObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadData();
        if (loadState !== 'idle') loadingObserver.disconnect();
      }
    }, { rootMargin: '240px' });
    loadingObserver.observe(study);
    const visibilityObserver = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting && (!disclosure || disclosure.open);
      if (!visible && playing) setPlaying(false);
    });
    visibilityObserver.observe(study);
  } else {
    let visibilityFrame = 0;
    const scheduleVisibility = () => {
      if (!visibilityFrame) visibilityFrame = window.requestAnimationFrame(() => {
        visibilityFrame = 0;
        checkVisibility();
      });
    };
    window.addEventListener('scroll', scheduleVisibility, { passive: true });
    window.addEventListener('resize', scheduleVisibility, { passive: true });
    checkVisibility();
  }

  setControlsEnabled(false);
  updateLanguage();
})();

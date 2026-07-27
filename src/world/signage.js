import * as THREE from 'three';

/**
 * All branding and surface detail is drawn on 2D canvases at load time, so the
 * build stays self-contained — no texture downloads, no font files, nothing
 * fetched at runtime.
 */

const canvasOf = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const finish = (canvas, { repeat = null, srgb = true } = {}) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
};

/**
 * The Nexus mark: four tapered blades meeting at the centre to read as an X.
 * Each blade is a lens bounded by two quadratic arcs — narrow at the hub,
 * pointed at the tip.
 */
function traceMark(ctx, cx, cy, radius, waist) {
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  // Blades run to the corners, slightly taller than wide, as in the renders.
  corners.forEach(([sx, sy]) => {
    const tipX = cx + sx * radius * 0.92;
    const tipY = cy + sy * radius;
    const midX = (cx + tipX) / 2;
    const midY = (cy + tipY) / 2;
    const axisX = tipX - cx;
    const axisY = tipY - cy;
    const axisLength = Math.hypot(axisX, axisY);
    const perpX = (-axisY / axisLength) * waist;
    const perpY = (axisX / axisLength) * waist;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(midX + perpX, midY + perpY, tipX, tipY);
    ctx.quadraticCurveTo(midX - perpX, midY - perpY, cx, cy);
    ctx.stroke();
  });
}

function drawWordmark(ctx, cx, y, scale, color) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `300 ${Math.round(96 * scale)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.letterSpacing = `${Math.round(26 * scale)}px`;
  ctx.fillText('NEXUS', cx + 13 * scale, y);

  ctx.font = `400 ${Math.round(40 * scale)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.letterSpacing = `${Math.round(20 * scale)}px`;
  ctx.fillText('ACADEMY', cx + 10 * scale, y + Math.round(74 * scale));

  ctx.letterSpacing = '0px';
}

/**
 * The facade brand panel. Returns a colour map (white panel, cool glyphs) and
 * a matching emissive map (glyphs on black) so only the lettering glows once
 * bloom is applied.
 */
export function makeBrandPanel({ width = 1024, height = 512, glow = '#8fdcff' } = {}) {
  const build = (emissive) => {
    const canvas = canvasOf(width, height);
    const ctx = canvas.getContext('2d');

    if (emissive) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    } else {
      const wash = ctx.createLinearGradient(0, 0, 0, height);
      wash.addColorStop(0, '#fdfefe');
      wash.addColorStop(1, '#eef4f8');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, width, height);
    }

    const ink = emissive ? glow : '#3aa9d8';
    ctx.strokeStyle = ink;
    ctx.shadowColor = glow;
    ctx.shadowBlur = emissive ? 34 : 16;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    // Hairline frame, inset from the panel edge.
    ctx.strokeRect(46, 40, width - 92, height - 80);

    traceMark(ctx, width / 2, height * 0.34, 118, 30);
    drawWordmark(ctx, width / 2, height * 0.66, 1, ink);

    return canvas;
  };

  return { map: finish(build(false)), emissiveMap: finish(build(true)) };
}

/** Free-standing glowing sign for interior walls — transparent background. */
export function makeGlowSign({ width = 1024, height = 420, color = '#7fe3ff', mark = true } = {}) {
  const canvas = canvasOf(width, height);
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 40;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  if (mark) traceMark(ctx, width / 2, height * 0.3, 92, 24);
  drawWordmark(ctx, width / 2, height * 0.68, 0.92, color);
  return finish(canvas);
}

/** Wall-mounted holographic readout, e.g. "QUANTUM NEURAL NETWORKS". */
export function makeDataPanel(lines, { width = 512, height = 256, color = '#8fe8ff' } = {}) {
  const canvas = canvasOf(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(4,18,30,0.55)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    const size = i === 0 ? 40 : 24;
    ctx.font = `${i === 0 ? 500 : 300} ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    ctx.letterSpacing = i === 0 ? '4px' : '2px';
    ctx.fillText(line, 40, 46 + i * 52);
  });
  ctx.letterSpacing = '0px';

  // Faint scanlines so it reads as a projection rather than paint.
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  for (let y = 20; y < height - 20; y += 5) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }
  return finish(canvas);
}

/** Value-noise field, reused for stone veining and foliage break-up. */
function noiseField(ctx, width, height, cells, alpha, tint) {
  const step = Math.max(2, Math.floor(width / cells));
  ctx.globalAlpha = alpha;
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      const shade = Math.random();
      ctx.fillStyle = tint(shade);
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.globalAlpha = 1;
}

/** Polished stone paving: large format tiles with fine veining and grout. */
export function makeStoneTexture({ size = 1024, tiles = 4, base = '#eceff2' } = {}) {
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  noiseField(ctx, size, size, 128, 0.05, (s) => `rgb(${200 + s * 55},${205 + s * 50},${212 + s * 43})`);

  // Veining: long, low-contrast strokes.
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    ctx.strokeStyle = `rgba(150,163,178,${0.05 + Math.random() * 0.09})`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 7; s++) {
      x += (Math.random() - 0.5) * size * 0.4;
      y += (Math.random() - 0.35) * size * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Grout lines between tiles.
  const cell = size / tiles;
  ctx.strokeStyle = 'rgba(140,152,166,0.5)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
    ctx.stroke();
  }

  return canvas;
}

/** Derive a normal map from a canvas' luminance, via Sobel gradients. */
export function normalFromCanvas(sourceCanvas, strength = 1.6) {
  const size = sourceCanvas.width;
  const source = sourceCanvas.getContext('2d').getImageData(0, 0, size, size).data;
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext('2d');
  const out = ctx.createImageData(size, size);

  const lum = (x, y) => {
    const px = ((y + size) % size) * size + ((x + size) % size);
    const i = px * 4;
    return (source[i] * 0.299 + source[i + 1] * 0.587 + source[i + 2] * 0.114) / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        lum(x - 1, y - 1) + 2 * lum(x - 1, y) + lum(x - 1, y + 1) -
        (lum(x + 1, y - 1) + 2 * lum(x + 1, y) + lum(x + 1, y + 1));
      const dy =
        lum(x - 1, y - 1) + 2 * lum(x, y - 1) + lum(x + 1, y - 1) -
        (lum(x - 1, y + 1) + 2 * lum(x, y + 1) + lum(x + 1, y + 1));
      const normal = new THREE.Vector3(dx * strength, dy * strength, 1).normalize();
      const i = (y * size + x) * 4;
      out.data[i] = (normal.x * 0.5 + 0.5) * 255;
      out.data[i + 1] = (normal.y * 0.5 + 0.5) * 255;
      out.data[i + 2] = (normal.z * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** Tiling ripple normal map for the pools and fountain basins. */
export function makeWaterNormals(size = 512) {
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  // Frequencies must be whole numbers for the tile to stay seamless. Using many
  // co-prime pairs breaks up the regular plaid a handful of waves produces.
  const waves = [
    { fx: 3, fy: 2, amp: 0.7, phase: 0 },
    { fx: -2, fy: 5, amp: 0.55, phase: 1.1 },
    { fx: 7, fy: -3, amp: 0.4, phase: 2.4 },
    { fx: 11, fy: 9, amp: 0.22, phase: 0.7 },
    { fx: -13, fy: 4, amp: 0.18, phase: 3.3 },
    { fx: 5, fy: 17, amp: 0.14, phase: 1.9 },
    { fx: 19, fy: -11, amp: 0.1, phase: 0.35 },
    { fx: -7, fy: -23, amp: 0.08, phase: 2.8 },
  ];
  const TAU = Math.PI * 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let dx = 0;
      let dy = 0;
      // Analytic derivatives keep the map seamless at the tile edges.
      waves.forEach(({ fx, fy, amp, phase }) => {
        const arg = TAU * (fx * u + fy * v) + phase;
        dx += amp * fx * Math.cos(arg);
        dy += amp * fy * Math.cos(arg);
      });
      const normal = new THREE.Vector3(-dx * 0.05, -dy * 0.05, 1).normalize();
      const i = (y * size + x) * 4;
      image.data[i] = (normal.x * 0.5 + 0.5) * 255;
      image.data[i + 1] = (normal.y * 0.5 + 0.5) * 255;
      image.data[i + 2] = (normal.z * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return finish(canvas, { repeat: [7, 9], srgb: false });
}

/**
 * Cumulus cloud cover for the sky dome, as an alpha map in equirectangular
 * layout. Clouds are clumped and biased toward the horizon band so the dome
 * reads correctly from a ground-level camera.
 */
export function makeCloudTexture({ width = 2048, height = 1024, columns = 16, rows = 5 } = {}) {
  const canvas = canvasOf(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  const puff = (x, y, radius, strength) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${strength})`);
    gradient.addColorStop(0.5, `rgba(255,255,255,${strength * 0.45})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Clumps are seeded on a jittered grid rather than at random. Purely random
  // placement lets them coalesce into one unbroken band of overcast, which is
  // what turns the whole sky milky — separated cells guarantee open blue.
  const cellW = width / columns;
  // v = 0 is the zenith; keep the mass between there and just above the horizon.
  const bandTop = height * 0.04;
  const bandHeight = height * 0.4;
  const cellH = bandHeight / rows;

  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < rows; row++) {
      if (Math.random() > 0.55) continue; // leave real gaps
      const cx = cellW * (col + 0.2 + Math.random() * 0.6);
      const cy = bandTop + cellH * (row + 0.25 + Math.random() * 0.5);
      const spread = 20 + Math.random() * 26;
      const puffs = 5 + Math.floor(Math.random() * 5);
      for (let p = 0; p < puffs; p++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spread;
        // Cumulus are wider than tall, with flatter bases.
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.abs(Math.sin(angle)) * distance * -0.34;
        const radius = 12 + Math.random() * 17;
        const strength = 0.4 + Math.random() * 0.3;
        puff(x, y, radius, strength);
        // Wrap so the equirectangular seam is invisible.
        if (x < radius) puff(x + width, y, radius, strength);
        if (x > width - radius) puff(x - width, y, radius, strength);
      }
    }
  }

  return finish(canvas);
}

/** Mown lawn / planting bed colour, with enough break-up to avoid flat green. */
export function makeFoliageTexture({ size = 512, dark = 30, light = 90 } = {}) {
  const canvas = canvasOf(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = `rgb(${dark + 14},${light},${dark + 26})`;
  ctx.fillRect(0, 0, size, size);
  noiseField(
    ctx,
    size,
    size,
    170,
    0.55,
    (s) => `rgb(${dark + s * 34},${light - 26 + s * 58},${dark + s * 30})`
  );
  return canvas;
}

export const textureFrom = finish;

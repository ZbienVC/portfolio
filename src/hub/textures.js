import * as THREE from 'three';

// Procedural texture maps — no external assets, generated once at module load.
// Each maker returns { map, bumpMap } (canvas textures, repeat-wrapped).

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}

function tex(c, { srgb = true, repeat = 1 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// seeded RNG so the world is deterministic
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// soft blob helper — the cheap way to get organic low-frequency variation
function blobs(g, size, R, n, rad, alpha, colorFn) {
  for (let i = 0; i < n; i++) {
    const x = R() * size, y = R() * size, r = rad(R);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const c = colorFn(R);
    grad.addColorStop(0, `rgba(${c},${alpha(R)})`);
    grad.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = grad;
    // wrap edges so the tile repeats seamlessly
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
      g.save(); g.translate(dx, dy);
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }
}

export function makeSnowMaps() {
  const S = 512;
  const R = rng(2026);
  // albedo — cool blue-white with wind-blown tonal drifts + crystalline speckle
  const [c, g] = canvas(S);
  g.fillStyle = '#dfe7f4'; g.fillRect(0, 0, S, S);
  blobs(g, S, R, 90, (r) => 30 + r() * 90, (r) => 0.10 + r() * 0.12, (r) =>
    r() > 0.5 ? '190,205,230' : '235,242,252');
  blobs(g, S, R, 40, (r) => 60 + r() * 120, (r) => 0.05 + r() * 0.08, () => '160,178,210');
  // sparkle: tiny bright crystals + faint shadow specks
  for (let i = 0; i < 2600; i++) {
    const x = R() * S, y = R() * S;
    g.fillStyle = R() > 0.24 ? `rgba(255,255,255,${0.25 + R() * 0.5})` : `rgba(140,158,195,${0.2 + R() * 0.25})`;
    g.fillRect(x, y, 1 + R(), 1 + R());
  }
  // bump — same language in grayscale (drift relief + grain)
  const R2 = rng(77);
  const [bc, bg] = canvas(S);
  bg.fillStyle = '#808080'; bg.fillRect(0, 0, S, S);
  blobs(bg, S, R2, 110, (r) => 24 + r() * 80, (r) => 0.16 + r() * 0.2, (r) =>
    r() > 0.5 ? '40,40,40' : '215,215,215');
  for (let i = 0; i < 3200; i++) {
    bg.fillStyle = R2() > 0.5 ? `rgba(255,255,255,${0.3 + R2() * 0.4})` : `rgba(0,0,0,${0.25 + R2() * 0.3})`;
    bg.fillRect(R2() * S, R2() * S, 1.4, 1.4);
  }
  return { map: tex(c), bumpMap: tex(bc, { srgb: false }) };
}

export function makeWoodMaps() {
  const S = 512;
  const R = rng(4242);
  const [c, g] = canvas(S);
  g.fillStyle = '#67492f'; g.fillRect(0, 0, S, S);
  const rows = 6, rowH = S / rows;
  for (let rI = 0; rI < rows; rI++) {
    const y0 = rI * rowH;
    // per-log tonal shift
    g.fillStyle = `rgba(${R() > 0.5 ? '120,88,55' : '80,56,34'},${0.22 + R() * 0.2})`;
    g.fillRect(0, y0, S, rowH);
    // grain streaks
    for (let i = 0; i < 26; i++) {
      const gy = y0 + 4 + R() * (rowH - 8);
      g.strokeStyle = `rgba(${R() > 0.4 ? '52,34,20' : '150,112,72'},${0.12 + R() * 0.22})`;
      g.lineWidth = 0.8 + R() * 1.6;
      g.beginPath();
      g.moveTo(0, gy);
      for (let x = 0; x <= S; x += 32) g.lineTo(x, gy + Math.sin(x * 0.02 + R() * 6) * 2.2);
      g.stroke();
    }
    // seam between logs
    g.fillStyle = 'rgba(24,14,8,0.75)';
    g.fillRect(0, y0 + rowH - 2.5, S, 2.5);
    g.fillStyle = 'rgba(190,150,100,0.18)';
    g.fillRect(0, y0, S, 2);
  }
  // a few knots
  for (let i = 0; i < 7; i++) {
    const x = R() * S, y = R() * S;
    for (let k = 4; k > 0; k--) {
      g.strokeStyle = `rgba(40,24,12,${0.28})`;
      g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(x, y, k * 3.2, k * 2.0, 0, 0, Math.PI * 2); g.stroke();
    }
  }
  const [bc, bg] = canvas(S);
  bg.fillStyle = '#8a8a8a'; bg.fillRect(0, 0, S, S);
  for (let rI = 0; rI < rows; rI++) {
    const y0 = rI * rowH;
    bg.fillStyle = 'rgba(0,0,0,0.85)'; bg.fillRect(0, y0 + rowH - 3, S, 3);
    bg.fillStyle = 'rgba(255,255,255,0.35)'; bg.fillRect(0, y0, S, 2);
    const R3 = rng(rI * 13 + 5);
    for (let i = 0; i < 20; i++) {
      const gy = y0 + 4 + R3() * (rowH - 8);
      bg.strokeStyle = `rgba(${R3() > 0.5 ? '0,0,0' : '255,255,255'},0.18)`;
      bg.lineWidth = 1;
      bg.beginPath(); bg.moveTo(0, gy); bg.lineTo(S, gy + (R3() - 0.5) * 5); bg.stroke();
    }
  }
  return { map: tex(c), bumpMap: tex(bc, { srgb: false }) };
}

export function makeRockMaps() {
  const S = 512;
  const R = rng(919);
  const [c, g] = canvas(S);
  g.fillStyle = '#4e5a72'; g.fillRect(0, 0, S, S);
  blobs(g, S, R, 120, (r) => 18 + r() * 70, (r) => 0.14 + r() * 0.18, (r) =>
    r() > 0.5 ? '30,38,56' : '112,126,152');
  // cracks
  for (let i = 0; i < 26; i++) {
    let x = R() * S, y = R() * S;
    g.strokeStyle = `rgba(18,24,38,${0.3 + R() * 0.3})`;
    g.lineWidth = 0.8 + R() * 1.4;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 8; s++) { x += (R() - 0.5) * 60; y += (R() - 0.5) * 60; g.lineTo(x, y); }
    g.stroke();
  }
  const R4 = rng(31);
  const [bc, bg] = canvas(S);
  bg.fillStyle = '#7d7d7d'; bg.fillRect(0, 0, S, S);
  blobs(bg, S, R4, 130, (r) => 16 + r() * 60, (r) => 0.2 + r() * 0.24, (r) =>
    r() > 0.5 ? '20,20,20' : '235,235,235');
  return { map: tex(c), bumpMap: tex(bc, { srgb: false }) };
}

// soft radial disc — used for footprints and smoke
export function makeSoftDisc(color = '30,40,60') {
  const [c, g] = canvas(64);
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, `rgba(${color},0.9)`);
  grad.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return t;
}

// module-level singletons (generated once, shared everywhere)
let _snow, _wood, _rock;
export const snowMaps = () => (_snow ??= makeSnowMaps());
export const woodMaps = () => (_wood ??= makeWoodMaps());
export const rockMaps = () => (_rock ??= makeRockMaps());

/* eslint-disable no-unused-vars -- vendored as-is from Atelier */
/* Vendored from Atelier (ZbienVC/atelier, scenes/shader-gradient/engine.js, motion lab)
   as an ES module: the IIFE returns the factory instead of writing window.ShaderGradient.
   Changed here (worth taking back upstream): the program compiles without blocking
   (KHR_parallel_shader_compile, CSS still until ready), only the active form is
   compiled, silk shares one domain-warp sample across its five height samples, and
   software-rendered contexts are refused. On Windows/ANGLE the old synchronous compile
   froze the page for 8-16 s. */
/* shader-gradient — Atelier's own zero-dependency WebGL shader gradient. MIT.

   A lit, slowly undulating colour surface (living silk, molten glaze) drawn
   as ONE subdivided sheet that the vertex shader folds with simplex noise.
   Normals come from central differences of the same height function, so the
   key light rolls over every fold; colour follows the folds (the glaze pools
   in the hollows and breaks thin over the crests); film grain and an ordered
   dither finish the frame. No three.js, no libraries, one draw call.

   Presets (ceramic glazes): tenmoku · oribe · shino · oxblood

     const g = ShaderGradient(canvas, { preset: "tenmoku" });
     g.set({ speed: 0.2, gloss: 0.9 });  // any option; eased in over ~1 s
     g.preset("oxblood");                 // swap the glaze; eased in
     g.pause(); g.resume();               // your pause (offscreen / hidden-tab pauses are automatic)
     g.render(12);                        // draw the frame at clock 12 (poster frames)
     g.destroy();                         // frees GL objects, observers and listeners
     g.state;                             // "webgl" | "fallback"
*/
const ShaderGradient = (() => {

  /* ── CONFIG — engine constants. Retune here; nothing below hard-codes them. ── */
  const CONFIG = {
    cols: 160,          // sheet subdivisions across …
    rows: 100,          // … and in depth: 161 × 101 = 16,261 vertices (Uint16 indices)
    fov: 36,            // vertical field of view, degrees
    distance: 5.4,      // camera distance to the sheet's centre at zoom 1 (world units)
    amplitude: 0.5,     // fold height at strength 1 (world units)
    scale: 0.3,         // noise cycles per world unit at frequency 1
    foldAngle: -24,     // the direction folds run across the sheet, degrees
    lightHeight: 34,    // key-light elevation above the sheet, degrees
    fog: [1.6, 3.2],    // the far sheet sinks into `ground` between these × camera distance
    maxDpr: 1.5,        // devicePixelRatio clamp for the backing store
    maxDt: 1 / 30,      // per-frame time clamp, so a stalled tab never lurches
    ease: 0.9,          // seconds for a preset / option change to settle
    parallax: 0.4,      // camera travel at pointer 1 (world units)
    follow: 0.5,        // seconds for the camera to catch up with the pointer
    restTime: 14,       // clock of the composed still (reduced motion, first frame)
  };

  /* ── PRESETS — ceramic glazes. colors = [pool, body, break]: a glaze pools
     thick in the hollows, shows its body on the slopes and breaks thin over
     every crest, which is exactly how the height ramp below spends them. ── */
  const PRESETS = {
    // Iron-saturate: black-brown body that breaks rust and amber over the ridges.
    tenmoku: { colors: ["#120805", "#2c1409", "#b25a21"], ground: "#0e0907", form: "silk",
               speed: 0.3, strength: 0.9, frequency: 1, density: 1.5, gloss: 0.85,
               light: 120, tilt: 42, zoom: 1, grain: 0.05 },
    // Copper in a glassy base: pools bottle-green, thins to a pale ash cream.
    oribe:   { colors: ["#0c1d13", "#35602d", "#d6cda6"], ground: "#0b0c08", form: "tide",
               speed: 0.4, strength: 0.9, frequency: 1.4, density: 2, gloss: 0.8,
               light: 100, tilt: 46, zoom: 1, grain: 0.05 },
    // Thick feldspar, matte and soft: warm white flashing orange to iron red.
    shino:   { colors: ["#f3eadf", "#ead3bb", "#c8643a"], ground: "#17110e", form: "silk",
               speed: 0.2, strength: 0.95, frequency: 0.7, density: 1.2, gloss: 0.15,
               light: 115, tilt: 38, zoom: 1.05, grain: 0.1 },
    // Copper reduced (sang de bœuf): liver-dark pools, deep red, bright where thin.
    oxblood: { colors: ["#240405", "#7a0c12", "#c0302a"], ground: "#100706", form: "silk",
               speed: 0.16, strength: 1.15, frequency: 0.7, density: 1.3, gloss: 1,
               light: 105, tilt: 40, zoom: 0.95, grain: 0.04 },
  };
  Object.keys(PRESETS).forEach((k) => { Object.freeze(PRESETS[k].colors); Object.freeze(PRESETS[k]); });
  Object.freeze(PRESETS);

  const DEFAULTS = Object.freeze(Object.assign({}, PRESETS.tenmoku, { renderScale: 1, pointer: 0.5, seed: 0 }));

  /* ── GLSL ─────────────────────────────────────────────────────────────── */

  // Simplex noise, snoise(vec3). Ported unchanged apart from formatting.
  //   Description : Array and textureless GLSL 2D/3D/4D simplex noise functions.
  //        Author : Ian McEwan, Ashima Arts.
  //    Maintainer : stegu (Stefan Gustavson)
  //       Lastmod : 20201014 (stegu)
  //       License : Copyright (C) 2011 Ashima Arts. All rights reserved.
  //                 Distributed under the MIT License. See LICENSE file.
  //                 github.com/ashima/webgl-noise · github.com/stegu/webgl-noise
  const NOISE = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

  const VERT = `precision highp float;

attribute vec2 aGrid;      // (across, depth) in 0..1 — depth 0 is the edge nearest the camera

uniform mat4 uViewProj;
uniform vec4 uSheet;       // near y, far y, near half-width, far half-width (world units)
uniform float uRowCurve;   // > 1 packs rows toward the camera, where they are seen largest
uniform float uTime;       // the gradient's clock
uniform vec2 uScale;       // noise cycles per world unit, along / across the folds
uniform vec2 uFold;        // cos, sin of the fold direction
uniform vec2 uSeed;        // noise-domain offset
uniform float uAmp;        // world height of a unit fold
uniform float uForm;       // 0 = silk … 1 = tide (blends while switching)
uniform float uEps;        // central-difference step, world units
uniform vec3 uEyeV;        // camera position (the far sheet sheds its fine creases)
uniform vec2 uDetail;      // distance where the fine creases start / finish fading

varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;     // the broad fold height (first octave), about -1..1
varying float vCurve;      // + over crests (convex), - in hollows (concave)
varying vec2 vUv;          // position on the visible sheet, 0..1
${NOISE}
vec2 foldSpace(vec2 p) {
  return vec2(uFold.x * p.x + uFold.y * p.y, uFold.x * p.y - uFold.y * p.x) * uScale + uSeed;
}

// Each form returns (full height, broad height): the full height shapes and
// lights the sheet; the broad one alone drives colour, so colour flows in
// wide bands while the finer creases show up in the light.

// silk: two octaves plus one slow domain warp, so folds bend and never tile.
// The warp moves far slower than the difference step, so main() samples it
// once and all five height samples share it (10 noise calls saved per vertex).
vec2 silk(vec2 q, float fine, float warp) {
  q += vec2(0.62, -0.38) * warp;
  float broad = snoise(vec3(q, uTime * 0.8));
  return vec2(broad + fine * 0.3 * snoise(vec3(q * 2.1 + 3.7, uTime * 1.25)), broad);
}

// tide: travelling ridges (a sine along one axis whose phase and height are
// bent by noise) plus a little cross-chop so it never reads as corduroy
vec2 tide(vec2 q, float fine) {
  float bend  = snoise(vec3(q * 0.35, uTime * 0.3));
  float swell = snoise(vec3(q * 0.22 + 19.7, uTime * 0.2));
  float s = sin(q.y * 4.5 + bend * 2.2 - uTime * 2.4);
  float broad = 0.8 * (s + 0.28 * s * s - 0.14) * (0.62 + 0.38 * swell);   // sharp crests, flat troughs
  return vec2(broad + fine * 0.12 * snoise(vec3(q * 1.3 + 3.3, uTime * 0.7)), broad);
}

// fine = 1 up close, fading to 0 where creases would shrink below a pixel.
// Only the active form is compiled (FORM_TIDE or not): shader compilers inline
// everything, and carrying both forms doubled the compile time on D3D (ANGLE).
vec2 heightAt(vec2 p, float fine, float warp) {
  vec2 q = foldSpace(p);
#ifdef FORM_TIDE
  return tide(q, fine);
#else
  return silk(q, fine, warp);
#endif
}

void main() {
  float depth = pow(aGrid.y, uRowCurve);
  float halfW = mix(uSheet.z, uSheet.w, depth);
  vec2 p = vec2((aGrid.x * 2.0 - 1.0) * halfW, mix(uSheet.x, uSheet.y, depth));

  // fine creases fade where the grid is too coarse to draw them (under ~5 samples
  // per wavelength) and where distance would shrink them below a pixel
  float stepX = 2.0 * halfW / ${CONFIG.cols}.0;
  float stepY = (uSheet.y - uSheet.x) * uRowCurve * pow(max(aGrid.y, 0.001), uRowCurve - 1.0) / ${CONFIG.rows}.0;
  float crease = 1.0 / (2.1 * max(uScale.x, uScale.y));
  float fine = smoothstep(3.0, 6.0, crease / max(stepX, stepY))
             * (1.0 - smoothstep(uDetail.x, uDetail.y, distance(vec3(p, 0.0), uEyeV)));

#ifdef FORM_TIDE
  float warp = 0.0;
#else
  float warp = snoise(vec3(foldSpace(p) * 0.42 + 7.1, uTime * 0.45));
#endif

  // the same height function five times: here, and a step either side in x and y
  vec2 here = heightAt(p, fine, warp);
  float h  = here.x;
  float hr = heightAt(p + vec2(uEps, 0.0), fine, warp).x;
  float hl = heightAt(p - vec2(uEps, 0.0), fine, warp).x;
  float hu = heightAt(p + vec2(0.0, uEps), fine, warp).x;
  float hd = heightAt(p - vec2(0.0, uEps), fine, warp).x;

  vec2 slope = vec2(hr - hl, hu - hd) * (uAmp / (2.0 * uEps));
  vNormal = normalize(vec3(-slope, 1.0));
  vCurve = (4.0 * h - hr - hl - hu - hd) / (uEps * uEps * dot(uScale, uScale));
  vHeight = here.y;
  vUv = vec2(aGrid.x, depth);
  vWorld = vec3(p, h * uAmp);
  gl_Position = uViewProj * vec4(vWorld, 1.0);
}
`;

  const FRAG = `precision mediump float;
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif

uniform vec3 uPool;        // glaze colours, linear RGB: pooled thick …
uniform vec3 uBody;        // … the body on the slopes …
uniform vec3 uBreak;       // … and where it breaks thin over the crests
uniform vec3 uGround;      // what the far sheet and the edges sink into
uniform vec3 uLight;       // unit vector toward the key light
uniform vec3 uEye;         // camera position
uniform float uGloss;      // 0 matte … 1 wet glass
uniform float uGrain;      // film grain amount
uniform vec2 uGrainShift;  // moves the grain every frame
uniform vec2 uRes;         // drawing-buffer size, px
uniform vec2 uFog;         // fog start, end (world distance from the eye)

varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;
varying float vCurve;
varying vec2 vUv;

const vec3 KEY = vec3(1.0, 0.92, 0.82);   // warm key light, linear

vec3 glazeRamp(float t) {
  vec3 c = mix(uPool, uBody, smoothstep(0.1, 0.42, t));
  return mix(c, uBreak, smoothstep(0.64, 0.98, t));
}

// identity below 0.75, then a soft shoulder toward 1 (keeps preset colours true)
vec3 shoulder(vec3 x) {
  vec3 over = max(x - 0.75, 0.0);
  return min(x, vec3(0.75)) + 0.25 * (1.0 - exp(-over * 4.0));
}

// film grain hash, after Dave Hoskins' "Hash without Sine" (MIT)
float grainHash(HP vec2 p) {
  HP vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

// 4x4 ordered (Bayer) threshold, 0 .. 15/16, built from two 2x2 levels
float bayer4(vec2 p) {
  vec2 a = mod(floor(p), 4.0);
  vec2 f = mod(a, 2.0);
  vec2 c = floor(a * 0.5);
  return fract(f.x * 0.5 + f.y * f.y * 0.75) + 0.25 * fract(c.x * 0.5 + c.y * c.y * 0.75);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uEye - vWorld);
  float ndv = dot(n, v);
  if (ndv < 0.0) { n = -n; ndv = -ndv; }

  // colour flows with the folds: it pools in hollows and breaks over crests and
  // sharp creases, and like glaze on a pot runs thin toward the rim (far edge)
  // and gathers toward the foot (near edge)
  float t = 0.5 + 0.38 * vHeight + clamp(0.006 * vCurve, -0.2, 0.3)
          + 0.28 * (vUv.y - 0.5) + 0.1 * (vUv.x - 0.5);
  vec3 base = glazeRamp(clamp(t, 0.0, 1.0));

  // soft wrap-lambert key over a warm ambient floor
  float wrap = max((dot(n, uLight) + 0.5) / 1.5, 0.0);
  vec3 col = base * (0.38 + 0.8 * wrap);

  // Blinn-Phong: a crisp white highlight that tightens with gloss, plus a broad
  // sheen tinted by the glaze itself (silk and glaze shine in their own colour)
  float nh = max(dot(n, normalize(uLight + v)), 0.0);
  float spec = uGloss * pow(nh, mix(12.0, 90.0, uGloss)) * mix(0.2, 1.1, uGloss);
  float sheen = (0.25 + 0.75 * uGloss) * pow(nh, 4.0);
  col += KEY * spec + mix(uBody, uBreak, 0.4) * sheen * 0.35;

  // fresnel: a faint rim toward the break colour at grazing angles
  float fres = pow(1.0 - ndv, 4.0);
  col = mix(col, uBreak * (1.0 + 0.4 * uGloss), fres * 0.22);

  // atmosphere: the far sheet sinks into the ground, and a soft vignette
  col = mix(col, uGround, smoothstep(uFog.x, uFog.y, length(uEye - vWorld)));
  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  col = mix(col, uGround, smoothstep(0.3, 0.95, length(q * vec2(1.0, 1.2))) * 0.4);

  // gentle tone curve, then encode for the screen
  col = pow(shoulder(col), vec3(1.0 / 2.2));

  // film grain, strongest in the midtones, then a +-0.5/255 ordered dither
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += (grainHash(gl_FragCoord.xy + uGrainShift) - 0.5) * uGrain * (0.4 + 2.4 * lum * (1.0 - lum));
  col += (bayer4(gl_FragCoord.xy) - 0.46875) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

  const UNIFORMS = ["uViewProj", "uSheet", "uRowCurve", "uTime", "uScale", "uFold", "uSeed", "uAmp",
    "uForm", "uEps", "uEyeV", "uDetail", "uPool", "uBody", "uBreak", "uGround", "uLight", "uEye", "uGloss", "uGrain",
    "uGrainShift", "uRes", "uFog"];
  // eased options and how close counts as arrived (in each option's own units)
  const SETTLE = { speed: 1e-4, strength: 1e-3, frequency: 1e-3, density: 1e-3, gloss: 1e-3,
    tilt: 0.02, zoom: 1e-3, grain: 2e-4, form: 1e-3 };
  const SCALARS = Object.keys(SETTLE);
  const COLOURS = ["pool", "body", "brk", "ground"];

  /* ── small helpers ────────────────────────────────────────────────────── */
  const rad = (d) => (d * Math.PI) / 180;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const isHex = (h) => typeof h === "string" && HEX.test(h);

  function hexRgb(hex) {                       // "#c26c28" → [194, 108, 40]
    let h = hex.slice(1);
    if (h.length === 3) h = h.replace(/./g, "$&$&");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const toLinear = (hex) => hexRgb(hex).map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const rgba = (hex, a) => `rgb(${hexRgb(hex).join(" ")} / ${a.toFixed(3)})`;
  function mixHex(a, b, t) {
    const x = hexRgb(a), y = hexRgb(b);
    return "#" + x.map((c, i) => Math.round(c + (y[i] - c) * t).toString(16).padStart(2, "0")).join("");
  }

  // Validate a merged option object; anything missing or out of range keeps `prev`.
  function sanitize(o, prev) {
    const num = (v, lo, hi, fb) => (typeof v === "number" && isFinite(v) ? clamp(v, lo, hi) : fb);
    const colors = Array.isArray(o.colors) && o.colors.length >= 3 && o.colors.slice(0, 3).every(isHex)
      ? o.colors.slice(0, 3) : prev.colors.slice();
    return {
      colors,
      ground: isHex(o.ground) ? o.ground : prev.ground,
      form: o.form === "tide" || o.form === "silk" ? o.form : prev.form,
      speed: num(o.speed, 0, 2, prev.speed),
      strength: num(o.strength, 0, 2, prev.strength),
      frequency: num(o.frequency, 0.2, 3, prev.frequency),
      density: num(o.density, 0.25, 3, prev.density),
      gloss: num(o.gloss, 0, 1, prev.gloss),
      light: ((num(o.light, -1e4, 1e4, prev.light) % 360) + 360) % 360,
      tilt: num(o.tilt, 0, 70, prev.tilt),
      zoom: num(o.zoom, 0.5, 2.5, prev.zoom),
      grain: num(o.grain, 0, 0.15, prev.grain),
      renderScale: num(o.renderScale, 0.5, 1, prev.renderScale),
      pointer: num(o.pointer, 0, 1, prev.pointer),
      seed: num(o.seed, -1e6, 1e6, prev.seed),
    };
  }

  // The eased, render-ready form of the options (colours in linear light).
  function goalOf(o) {
    return {
      speed: o.speed, strength: o.strength, frequency: o.frequency, density: o.density,
      gloss: o.gloss, light: o.light, tilt: o.tilt, zoom: o.zoom, grain: o.grain,
      form: o.form === "tide" ? 1 : 0,
      pool: toLinear(o.colors[0]), body: toLinear(o.colors[1]), brk: toLinear(o.colors[2]),
      ground: toLinear(o.ground),
    };
  }
  const copyGoal = (g) => Object.assign({}, g,
    { pool: g.pool.slice(), body: g.body.slice(), brk: g.brk.slice(), ground: g.ground.slice() });

  function seedOffset(seed) {                  // any number → a far-apart spot in noise space
    const f = (k) => { const s = Math.sin((seed + k) * 12.9898) * 43758.5453; return (s - Math.floor(s)) * 97; };
    return seed ? [f(1), f(2)] : [0, 0];
  }

  // mat4 (column-major, as WebGL expects)
  function perspective(out, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out.fill(0);
    out[0] = f / aspect; out[5] = f; out[10] = (far + near) * nf; out[11] = -1; out[14] = 2 * far * near * nf;
    return out;
  }
  function lookAt(out, eye, up) {              // looking at the origin
    let zx = eye[0], zy = eye[1], zz = eye[2], l = 1 / Math.hypot(zx, zy, zz);
    zx *= l; zy *= l; zz *= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = 1 / (Math.hypot(xx, xy, xz) || 1); xx *= l; xy *= l; xz *= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
    return out;
  }
  function multiply(out, a, b) {
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return out;
  }

  // The sheet: a unit grid, shared by every instance and every context restore.
  // Row 0 is the FAR edge, so triangles are submitted far → near and nearer
  // folds paint over the ones behind them: no depth buffer needed.
  let SHEET = null;
  function sheetGeometry() {
    if (SHEET) return SHEET;
    const { cols, rows } = CONFIG, grid = new Float32Array((cols + 1) * (rows + 1) * 2);
    let k = 0;
    for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) { grid[k++] = c / cols; grid[k++] = 1 - r / rows; }
    const index = new Uint16Array(cols * rows * 6);
    k = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = r * (cols + 1) + c, b = a + 1, d = a + cols + 1, e = d + 1;
      index[k++] = a; index[k++] = d; index[k++] = b;
      index[k++] = b; index[k++] = d; index[k++] = e;
    }
    return (SHEET = { grid, index, count: index.length });
  }

  // Fallback grain: one deterministic 128px noise tile, made once per page.
  let GRAIN = null;
  function grainTile() {
    if (GRAIN !== null) return GRAIN;
    GRAIN = "";
    try {
      const n = 128, cv = document.createElement("canvas");
      cv.width = cv.height = n;
      const cx = cv.getContext("2d"), img = cx.createImageData(n, n), d = img.data;
      let s = 2463534242;
      for (let i = 0; i < d.length; i += 4) {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5;          // xorshift32
        d[i] = d[i + 1] = d[i + 2] = (s >>> 0) & 255;
        d[i + 3] = 16;
      }
      cx.putImageData(img, 0, 0);
      GRAIN = cv.toDataURL("image/png");
    } catch (e) { GRAIN = ""; }
    return GRAIN;
  }

  let OKLCH = null;
  const oklch = () => (OKLCH !== null ? OKLCH
    : (OKLCH = !!(window.CSS && CSS.supports && CSS.supports("background-image", "linear-gradient(in oklch, red, red)"))));

  const media = (q) => (window.matchMedia ? window.matchMedia(q) : null);
  function onMedia(mq, fn, add) {
    if (!mq) return;
    if (mq.addEventListener) mq[add ? "addEventListener" : "removeEventListener"]("change", fn);
    else mq[add ? "addListener" : "removeListener"](fn);   // Safari < 14
  }

  /* ── the factory ──────────────────────────────────────────────────────── */
  function ShaderGradient(canvas, options) {
    if (!canvas || typeof canvas.getContext !== "function") {
      throw new TypeError("ShaderGradient: the first argument must be a <canvas>");
    }
    options = options || {};
    let opts = sanitize(Object.assign({}, PRESETS[options.preset], options), DEFAULTS);
    let goal = goalOf(opts);                   // where the picture is heading
    let live = copyGoal(goal);                 // what is on screen now
    let seed = seedOffset(opts.seed);
    let state = "fallback";
    let gl = null, program = null, vbo = null, ibo = null, loc = null;
    let raf = 0, last = 0, clock = CONFIG.restTime, frame = 0;
    let W = 0, H = 0, cssW = 0, cssH = 0;
    let userPaused = false, onscreen = true, destroyed = false;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const mqReduce = media("(prefers-reduced-motion: reduce)");
    const mqFine = media("(hover: hover) and (pointer: fine)");
    let reduced = !!(mqReduce && mqReduce.matches);
    const cam = {
      proj: new Float32Array(16), view: new Float32Array(16), viewProj: new Float32Array(16),
      eye: new Float32Array(3), sheet: new Float32Array(4), rowCurve: 1, fog: new Float32Array(2),
    };
    const style = canvas.style;
    const saved = [style.backgroundColor, style.backgroundImage, style.backgroundSize, style.backgroundRepeat];

    // A designed still made of the SAME colours, painted before WebGL exists:
    // it is what no-WebGL, a lost context and the very first paint all show.
    let painted = "";
    function paintFallback() {
      const [pool, body, brk] = opts.colors, ground = opts.ground;
      const key = [pool, body, brk, ground, opts.light, opts.gloss, opts.grain > 0].join();
      if (key === painted) return;               // only the colours, light and gloss show in it
      painted = key;
      const m = oklch() ? " in oklch" : "";
      const az = rad(opts.light);
      const lx = Math.round(50 + Math.cos(az) * 28), ly = Math.round(30 - Math.sin(az) * 14);
      const lift = mixHex(body, brk, 0.5), glint = mixHex(brk, "#fff4e6", 0.55);
      const layers = [
        // the edges sink into the ground, as the far sheet does in WebGL
        `radial-gradient(135% 105% at 50% 38%${m}, ${rgba(ground, 0)} 58%, ${rgba(ground, 0.72)})`,
        // a glint where the key light catches the glaze
        `radial-gradient(24% 13% at ${lx}% ${ly}%${m}, ${rgba(glint, 0.12 + 0.5 * opts.gloss)}, ${rgba(glint, 0)})`,
        // folds: soft diagonal bands, crests breaking to colour 3, hollows pooling to colour 1
        `linear-gradient(155deg${m}, ${rgba(pool, 0)} 0%, ${rgba(lift, 0.6)} 15%, ${rgba(brk, 0.75)} 21%, ` +
          `${rgba(body, 0)} 33%, ${rgba(pool, 0.65)} 45%, ${rgba(body, 0)} 56%, ${rgba(lift, 0.5)} 67%, ` +
          `${rgba(brk, 0.6)} 72%, ${rgba(body, 0)} 82%, ${rgba(pool, 0.7)} 100%)`,
        // rim to foot: thin and bright toward the top, pooling dark toward the bottom
        `linear-gradient(180deg${m}, ${lift}, ${body} 45%, ${pool})`,
      ];
      const grain = opts.grain > 0 ? grainTile() : "";
      style.backgroundColor = ground;
      style.backgroundImage = (grain ? `url("${grain}"), ` : "") + layers.join(", ");
      style.backgroundSize = (grain ? "128px 128px, " : "") + layers.map(() => "100% 100%").join(", ");
      style.backgroundRepeat = (grain ? "repeat, " : "") + layers.map(() => "no-repeat").join(", ");
    }

    function createContext() {
      // failIfMajorPerformanceCaveat: a software rasteriser (SwiftShader) would
      // spend ~200 ms a frame on this sheet; the CSS still is the better look there.
      const attrs = { alpha: false, antialias: false, depth: false, stencil: false,
        preserveDrawingBuffer: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true };
      try { gl = canvas.getContext("webgl", attrs) || canvas.getContext("experimental-webgl", attrs); }
      catch (e) { gl = null; }
      return !!gl && !gl.isContextLost();
    }

    // Compile + link WITHOUT blocking. Asking for a shader's status right after
    // compileShader makes the browser wait for the GPU process, and ANGLE's D3D
    // compiler can take seconds on this vertex shader: the page froze for 8-16 s
    // on Windows. With KHR_parallel_shader_compile we poll for completion and keep
    // the CSS still on screen until the program is ready; without it, we fall back
    // to the old synchronous path.
    let building = 0;            // build generation, so a stale build never lands
    let builtForm = null;
    function build(done) {
      const gen = ++building;
      const form = opts.form;
      const parallel = gl.getExtension("KHR_parallel_shader_compile");
      const shader = (type, source) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return s;
      };
      const vs = shader(gl.VERTEX_SHADER, (form === "tide" ? "#define FORM_TIDE\n" : "") + VERT);
      const fs = shader(gl.FRAGMENT_SHADER, FRAG);
      const next = gl.createProgram();
      gl.attachShader(next, vs);
      gl.attachShader(next, fs);
      gl.bindAttribLocation(next, 0, "aGrid");
      gl.linkProgram(next);

      const finish = () => {
        if (destroyed || gen !== building || gl.isContextLost()) return;
        const ok = gl.getProgramParameter(next, gl.LINK_STATUS);
        gl.detachShader(next, vs); gl.detachShader(next, fs);
        gl.deleteShader(vs); gl.deleteShader(fs);
        if (!ok) { gl.deleteProgram(next); done(false); return; }
        if (program) gl.deleteProgram(program);
        program = next;
        builtForm = form;
        done(setup());
      };
      if (!parallel) { finish(); return; }
      const poll = () => {
        if (destroyed || gen !== building || gl.isContextLost()) return;
        if (gl.getProgramParameter(next, parallel.COMPLETION_STATUS_KHR)) finish();
        else setTimeout(poll, 40);
      };
      poll();
    }

    // Program ready: uniforms, the sheet's buffers, fixed state.
    function setup() {
      gl.useProgram(program);
      loc = {};
      UNIFORMS.forEach((name) => { loc[name] = gl.getUniformLocation(program, name); });
      if (vbo) return true;      // a rebuild for a new form keeps the sheet's buffers
      const sheet = sheetGeometry();
      vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, sheet.grid, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sheet.index, gl.STATIC_DRAW);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      return true;
    }

    function freeGL() {
      if (gl && !gl.isContextLost()) {
        if (vbo) gl.deleteBuffer(vbo);
        if (ibo) gl.deleteBuffer(ibo);
        if (program) gl.deleteProgram(program);
      }
      vbo = ibo = program = loc = null;
    }

    function mark() { canvas.setAttribute("data-gradient", state); }

    // Camera on an orbit around the x axis, pitched `tilt` from face-on. The
    // sheet is fitted to the ground footprint of the view frustum (pointer
    // excluded, so parallax never re-tessellates) with slack for the folds.
    // Tall canvases (phones) widen the view, step back and look more face-on,
    // so folds keep a sensible size instead of filling a narrow slice.
    function updateCamera(amp) {
      const aspect = W / H, tall = aspect < 1 ? Math.min(1 / aspect, 2.6) : 1;
      const tilt = rad(live.tilt) * (1 - (0.65 * (tall - 1)) / 1.6), s = Math.sin(tilt), c = Math.cos(tilt);
      const D = (CONFIG.distance / live.zoom) * Math.pow(tall, 0.35);
      const ty = Math.tan(rad(CONFIG.fov) / 2) * Math.pow(tall, 0.5), tx = ty * aspect;
      const tNear = (D * c) / (c + ty * s);
      const reach = (CONFIG.fog[1] * 1.08 * D) / Math.sqrt(1 + ty * ty);
      const tFar = c - ty * s > 1e-3 ? Math.min((D * c) / (c - ty * s), reach) : reach;
      const drift = CONFIG.parallax * opts.pointer, slack = amp * 1.5 + drift;
      cam.sheet[0] = -D * s + tNear * (s - ty * c) - slack;
      cam.sheet[1] = -D * s + tFar * (s + ty * c) + slack * 2.5;
      cam.sheet[2] = tNear * tx + slack;
      cam.sheet[3] = tFar * tx * 1.04 + slack * 2;
      cam.rowCurve = 1 + 0.7 * s;
      cam.fog[0] = CONFIG.fog[0] * D; cam.fog[1] = CONFIG.fog[1] * D;
      // the eye, nudged along its own right / up axes toward the pointer
      const px = pointer.x * drift, py = -pointer.y * drift;
      cam.eye[0] = px; cam.eye[1] = -D * s + py * c; cam.eye[2] = D * c + py * s;
      lookAt(cam.view, cam.eye, [0, c, s]);
      perspective(cam.proj, 2 * Math.atan(ty), aspect, 0.05, D * 6);
      multiply(cam.viewProj, cam.proj, cam.view);
    }

    function draw() {
      if (state !== "webgl" || !W || !H) return;
      const sx = CONFIG.scale * live.frequency, sy = sx * live.density;
      // fold height; very fine folds are kept proportionally shallower so they
      // stay folds instead of turning into spikes (no preset reaches this)
      const amp = CONFIG.amplitude * live.strength * Math.min(1, 0.9 / Math.max(sx, sy));
      updateCamera(amp);
      const fold = rad(CONFIG.foldAngle), az = rad(live.light), el = rad(CONFIG.lightHeight);
      const g = live.ground.map((v) => Math.pow(v, 1 / 2.2));
      gl.uniformMatrix4fv(loc.uViewProj, false, cam.viewProj);
      gl.uniform4fv(loc.uSheet, cam.sheet);
      gl.uniform1f(loc.uRowCurve, cam.rowCurve);
      gl.uniform1f(loc.uTime, clock);
      gl.uniform2f(loc.uScale, sx, sy);
      gl.uniform2f(loc.uFold, Math.cos(fold), Math.sin(fold));
      gl.uniform2f(loc.uSeed, seed[0], seed[1]);
      gl.uniform1f(loc.uAmp, amp);
      gl.uniform1f(loc.uForm, live.form);
      gl.uniform1f(loc.uEps, clamp(0.05 / Math.max(sx, sy), 0.004, 0.08));
      gl.uniform3fv(loc.uPool, live.pool);
      gl.uniform3fv(loc.uBody, live.body);
      gl.uniform3fv(loc.uBreak, live.brk);
      gl.uniform3fv(loc.uGround, live.ground);
      gl.uniform3f(loc.uLight, Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el));
      gl.uniform3fv(loc.uEye, cam.eye);
      gl.uniform3fv(loc.uEyeV, cam.eye);
      gl.uniform2f(loc.uDetail, cam.fog[0] * 0.8, cam.fog[0] * 1.5);
      gl.uniform1f(loc.uGloss, live.gloss);
      gl.uniform1f(loc.uGrain, live.grain);
      gl.uniform2f(loc.uGrainShift, (frame * 37) % 509, (frame * 91) % 503);
      gl.uniform2f(loc.uRes, W, H);
      gl.uniform2fv(loc.uFog, cam.fog);
      gl.clearColor(g[0], g[1], g[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, SHEET.count, gl.UNSIGNED_SHORT, 0);
    }

    /* ── motion: one rAF loop that sleeps whenever nothing can change ── */
    const parallaxOn = () => opts.pointer > 0 && !reduced && !!(mqFine && mqFine.matches);
    const running = () => state === "webgl" && !destroyed && !userPaused && !reduced
      && onscreen && !document.hidden && W > 0 && H > 0;

    function wake() {
      if (raf || !running()) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    function tick(now) {
      raf = 0;
      if (!running()) return;
      const dt = last ? Math.min((now - last) / 1000, CONFIG.maxDt) : 1 / 60;
      last = now;
      const busy = advance(dt);
      draw();
      if (busy) raf = requestAnimationFrame(tick);
    }

    // Ease every option toward its goal (dt-normalised), follow the pointer,
    // run the clock. Returns true while anything is still moving.
    function advance(dt) {
      const k = 1 - Math.exp((-3 * dt) / CONFIG.ease);
      let busy = false;
      for (const key of SCALARS) {
        const d = goal[key] - live[key];
        if (Math.abs(d) > SETTLE[key]) { live[key] += d * k; busy = true; } else live[key] = goal[key];
      }
      const da = ((goal.light - live.light + 540) % 360) - 180;      // the short way round
      if (Math.abs(da) > 0.02) { live.light = (live.light + da * k + 360) % 360; busy = true; }
      else live.light = goal.light;
      for (const key of COLOURS) for (let i = 0; i < 3; i++) {
        const d = goal[key][i] - live[key][i];
        if (Math.abs(d) > 1e-4) { live[key][i] += d * k; busy = true; } else live[key][i] = goal[key][i];
      }
      const on = parallaxOn() ? 1 : 0, kf = 1 - Math.exp((-3 * dt) / CONFIG.follow);
      const tx = pointer.tx * on, ty = pointer.ty * on;
      pointer.x += (tx - pointer.x) * kf;
      pointer.y += (ty - pointer.y) * kf;
      if (Math.abs(tx - pointer.x) + Math.abs(ty - pointer.y) > 1e-4) busy = true;
      else { pointer.x = tx; pointer.y = ty; }
      clock += dt * live.speed;
      frame++;
      return busy || live.speed > 0;
    }

    // Reduced motion / paused: jump straight to the goal and show one frame.
    function settle() {
      live = copyGoal(goal);
      pointer.x = pointer.y = 0;
      draw();
    }

    /* ── sizing: CSS size × min(dpr, 1.5) × renderScale; every resize redraws ── */
    function measure() { cssW = canvas.clientWidth; cssH = canvas.clientHeight; }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr) * opts.renderScale;
      const w = Math.min(4096, Math.round(cssW * dpr)), h = Math.min(4096, Math.round(cssH * dpr));
      W = w > 0 && h > 0 ? w : 0;
      H = W ? h : 0;
      if (!W) return;
      if (canvas.width !== W) canvas.width = W;       // (this wipes the buffer …)
      if (canvas.height !== H) canvas.height = H;
      if (state === "webgl") { gl.viewport(0, 0, W, H); draw(); }   // (… so redraw at once)
      wake();
    }

    /* ── lifecycle listeners ── */
    const ro = window.ResizeObserver ? new ResizeObserver((entries) => {
      const r = entries[entries.length - 1].contentRect;
      cssW = r.width; cssH = r.height;
      resize();
    }) : null;
    const onWindowResize = () => { measure(); resize(); };
    const io = window.IntersectionObserver ? new IntersectionObserver((entries) => {
      onscreen = entries[entries.length - 1].isIntersecting;
      if (onscreen) wake(); else stop();
    }, { rootMargin: "64px" }) : null;
    const onVisibility = () => { if (document.hidden) stop(); else wake(); };
    const onReduce = () => {
      reduced = !!mqReduce.matches;
      if (reduced) { stop(); clock = CONFIG.restTime; settle(); } else wake();
    };
    const onPointerMove = (e) => {
      if (e.pointerType === "touch" || !parallaxOn()) return;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      wake();
    };
    const onPointerOut = (e) => {
      if (e.relatedTarget) return;             // left the window, not just an element
      pointer.tx = pointer.ty = 0;
      wake();
    };
    const onLost = (e) => {
      e.preventDefault();                      // ask the browser to give it back
      stop();
      state = "fallback";
      vbo = ibo = program = loc = null;        // gone with the context
      mark();
    };
    // the program is linked and set up: switch from the CSS still to the sheet
    const goLive = (ok) => {
      if (!ok || destroyed) return;
      state = "webgl";
      mark();
      resize();
      if (reduced || userPaused) settle();
      wake();
    };
    const onRestored = () => {
      if (destroyed) return;
      program = null;
      build(goLive);
    };

    /* ── boot: fallback first, then WebGL (compiled off the main thread), then the first frame ── */
    paintFallback();
    if (createContext()) build(goLive);
    mark();
    measure();
    resize();
    if (ro) {
      // the device-pixel box also fires when only the pixel ratio changes (zoom, another monitor)
      try { ro.observe(canvas, { box: "device-pixel-content-box" }); } catch (e) { ro.observe(canvas); }
    } else window.addEventListener("resize", onWindowResize);
    if (io) io.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    onMedia(mqReduce, onReduce, true);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);
    wake();

    /* ── public API ── */
    function set(partial) {
      if (destroyed || !partial || typeof partial !== "object") return api;
      const before = opts;
      opts = sanitize(Object.assign({}, opts, PRESETS[partial.preset], partial), opts);
      goal = goalOf(opts);
      if (opts.seed !== before.seed) seed = seedOffset(opts.seed);
      paintFallback();
      // each form is its own program now: switching recompiles (off-thread) and snaps
      if (state === "webgl" && builtForm && opts.form !== builtForm) build((ok) => { if (ok) { draw(); wake(); } });
      if (opts.renderScale !== before.renderScale) resize();
      if (running()) wake();
      else if (reduced || userPaused) settle();
      return api;
    }

    const api = {
      set,
      preset(name) { return PRESETS[name] ? set({ preset: name }) : api; },
      pause() { userPaused = true; stop(); return api; },
      resume() { userPaused = false; wake(); return api; },
      render(atSeconds) {
        if (typeof atSeconds === "number" && isFinite(atSeconds)) clock = atSeconds;
        if (!destroyed) draw();
        return api;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        stop();
        if (ro) ro.disconnect(); else window.removeEventListener("resize", onWindowResize);
        if (io) io.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        onMedia(mqReduce, onReduce, false);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerout", onPointerOut);
        canvas.removeEventListener("webglcontextlost", onLost, false);
        canvas.removeEventListener("webglcontextrestored", onRestored, false);
        freeGL();                              // the context itself stays usable for a remount
        canvas.removeAttribute("data-gradient");
        [style.backgroundColor, style.backgroundImage, style.backgroundSize, style.backgroundRepeat] = saved;
      },
      get state() { return state; },
      get options() { return Object.assign({}, opts, { colors: opts.colors.slice() }); },
    };
    return api;
  }

  ShaderGradient.PRESETS = PRESETS;
  ShaderGradient.DEFAULTS = DEFAULTS;
  return ShaderGradient;
})();

export default ShaderGradient;

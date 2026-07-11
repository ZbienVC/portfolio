/* WorldGrade — the shared colour-grade rig (ARCHITECTURE.md §2.5 tone LUT).
 *
 * Implements the LookPreset grade — exposure → tone curve (AgX/ACES/Cineon/
 * Reinhard/Neutral) → lift/gamma/gain → blackPoint crush → contrast — as a
 * per-channel 1-D LUT baked into an SVG <feComponentTransfer> filter, plus
 * saturation and tempBias via <feColorMatrix>. The browser composites the
 * filter on the GPU, so the FULL grade costs zero per-frame JS and re-grades
 * live on setLook. When look.material.model === "toon", the LUT itself is
 * posterised (toonSteps/rampBias) — banded shading for free.
 *
 * Renderer-agnostic: works on ANY element (the 2D canvas AND the WebGL
 * canvas). The 3D adapter passes { tone:false } because its renderer already
 * tone-maps natively — the rest of the grade (LGG/blackPoint/contrast/
 * saturation/tempBias) still applies, giving both adapters ONE identity.
 * Zero dependencies.
 */
(function () {
  "use strict";
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rgb01 = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  };

  // 1-D tone curves on [0,1] (film-ish approximations; Neutral = identity)
  const TONE = {
    ACES: (x) => clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0, 1),
    AgX: (x) => { const t = Math.pow(x, 1.12); return clamp(1.28 * t / (t + 0.28), 0, 1); },
    Cineon: (x) => clamp(1.22 * (1 - Math.exp(-1.8 * x)), 0, 1),
    Reinhard: (x) => clamp(2 * x / (1 + x) * 0.75 + x * 0.25, 0, 1),
    Neutral: (x) => x,
    none: (x) => x,
  };

  const N = 64;                        // samples per channel table
  let seq = 0;

  function tables(look, useTone) {
    const tone = TONE[look.tone.mapping] || TONE.Neutral;
    const lift = rgb01(look.palette.lift), gamma = rgb01(look.palette.gamma), gain = rgb01(look.palette.gain);
    const bp = look.palette.blackPoint || 0, contrast = look.palette.contrast || 1;
    // NO frame-LUT posterisation, ever. Toon banding is a per-object SHADING
    // concern (canvas: the fills are already flat; 3D: MeshToonMaterial,
    // §6.3) — a per-channel LUT over a frame full of gradients bands the sky
    // into flats and ROTATES HUE where channels posterise at different
    // thresholds (desert-confirmed: green rings around an orange sun).
    // look.material.toonSteps remains data for the real material path.
    const steps = 0, bias = 0;
    const out = [[], [], []];
    for (let i = 0; i < N; i++) {
      let x = i / (N - 1);
      for (let c = 0; c < 3; c++) {
        let v = x * look.tone.exposure;
        if (useTone) v = tone(clamp(v, 0, 4));
        v = clamp(v, 0, 1);
        v = v * (0.35 + 0.65 * (0.5 + gain[c] * 0.5));          // gain: highlight tint (#fff = identity)
        v = v + lift[c] * 0.22 * (1 - v);                        // lift: raise blacks toward tint
        v = Math.pow(clamp(v, 0, 1), 1 / (0.72 + 0.56 * gamma[c])); // gamma: midtone tint (#808080 = identity)
        v = clamp((v - bp) / (1 - bp), 0, 1);                    // blackPoint crush
        v = clamp(0.5 + (v - 0.5) * contrast, 0, 1);             // contrast about mid-grey
        if (steps) v = clamp((Math.round(v * (steps - 1) + bias) / (steps - 1)), 0, 1); // toon posterise
        out[c].push(v.toFixed(4));
      }
    }
    return out;
  }

  function ensureHost() {
    let host = document.getElementById("worldgrade-host");
    if (!host) {
      host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      host.setAttribute("id", "worldgrade-host");
      host.setAttribute("width", "0"); host.setAttribute("height", "0");
      host.setAttribute("style", "position:fixed;left:-9999px;top:0");
      document.body.appendChild(host);
    }
    return host;
  }

  /* apply(el, look, opts) — grade an element live. opts.tone=false skips the
   * tone curve (for renderers that tone-map natively). Returns a re-apply fn. */
  function apply(el, look, opts) {
    opts = opts || {};
    const useTone = opts.tone !== false;
    if (typeof document === "undefined" || !document.createElementNS) return; // headless: grade is visual-only
    const host = ensureHost();
    let id = el.__gradeId;
    if (!id) { id = el.__gradeId = "worldgrade-" + (++seq); }
    let filter = document.getElementById(id);
    if (!filter) {
      filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filter.setAttribute("id", id);
      filter.setAttribute("color-interpolation-filters", "sRGB");
      host.appendChild(filter);
    }
    while (filter.firstChild) filter.removeChild(filter.firstChild);
    const NS = "http://www.w3.org/2000/svg";
    const ct = document.createElementNS(NS, "feComponentTransfer");
    const t = tables(look, useTone);
    [["feFuncR", 0], ["feFuncG", 1], ["feFuncB", 2]].forEach(([tag, c]) => {
      const f = document.createElementNS(NS, tag);
      f.setAttribute("type", "table");
      f.setAttribute("tableValues", t[c].join(" "));
      ct.appendChild(f);
    });
    filter.appendChild(ct);
    const sat = document.createElementNS(NS, "feColorMatrix");
    sat.setAttribute("type", "saturate");
    sat.setAttribute("values", String(look.palette.saturation));
    filter.appendChild(sat);
    // tempBias = MULTIPLICATIVE white balance (channel gains), never an
    // additive offset: a constant push reads as candle-warmth on a dark
    // frame but clips a bright sky to salmon (desert-confirmed bug)
    const tb = (look.palette.tempBias || 0) * 0.10;
    if (tb) {
      const m = document.createElementNS(NS, "feColorMatrix");
      m.setAttribute("type", "matrix");
      m.setAttribute("values",
        `${1 + tb} 0 0 0 0  0 ${1 + tb * 0.25} 0 0 0  0 0 ${1 - tb} 0 0  0 0 0 1 0`);
      filter.appendChild(m);
    }
    el.style.filter = `url(#${id})`;
  }
  function clear(el) { if (el && el.style) el.style.filter = ""; }

  window.WorldGrade = { apply, clear, TONE };
})();

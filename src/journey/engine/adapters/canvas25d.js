/* CanvasWorldAdapter — the 2.5D render adapter (ARCHITECTURE.md §3.2).
 *
 * Consumes the SAME Frame + world.palette + LookPreset as the three.js
 * adapter — zero simulation here (no Math.random, no layout, no triggers;
 * the runtime owns all of that, §0). This is the GUARANTEED-portable path:
 * plain Canvas 2D, runs with WebGL entirely absent, re-grades live on look
 * change. The fox is drawn from the shared anatomy pose's point-chains —
 * the same joints the 3D adapter turns into bone meshes.
 *
 * §2.5 knob coverage (post-review):
 *  - palette/tone (lift/gamma/gain/tempBias/blackPoint/sat/contrast +
 *    AgX/ACES/Cineon LUT + exposure) → WorldGrade SVG feComponentTransfer
 *    rig (GPU-composited, zero per-frame JS); toon model posterises the LUT.
 *  - camera.fovMul → PPU zoom · swayAmp/Freq → ambient rail sway (frozen
 *    under reduced-motion) · parallax → scales layer/sky parallax.
 *  - post.bloom → additive-halo multiplier (§2.2's stated approximation)
 *    on moon/lantern/firefly glows · post.dof gates + scales the offscreen
 *    foreground blur (radius × canvasHints.blurScale) · grain/vignette real.
 *  - material.emissive → glow gain; material.outline (+canvasHints.inkWidth)
 *    → ink stroke on the fox silhouette; lighting.ambient → shadow softness
 *    + ground lift; canvasHints.textureBlend → speckle alpha.
 *  - camera FRAMING comes from the shared rail (frame.camera.pos), so
 *    look-ahead facing flips and velocity lead match the 3D adapter.
 */
(function () {
  "use strict";
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ksm = (k, dt) => 1 - Math.pow(1 - k, dt * 60);
  const TAU = Math.PI * 2;

  function rgb(c) {
    if (c[0] === "#") { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    return c.split(",").map(Number);
  }
  const rgba = (c, a) => { const p = rgb(c); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; };
  function shade(c, m) { const p = rgb(c); return `rgb(${p[0] * m | 0},${p[1] * m | 0},${p[2] * m | 0})`; }
  function mix(c1, c2, t) { const a = rgb(c1), b = rgb(c2); return `rgb(${lerp(a[0], b[0], t) | 0},${lerp(a[1], b[1], t) | 0},${lerp(a[2], b[2], t) | 0})`; }

  function CanvasWorldAdapter(canvas, world, runtime, look) {
    const P = world.palette;
    const ctx = canvas.getContext("2d");
    const RS = (world.protagonist.renderScale || 0.72) * (world.protagonist.scale || 1);
    const kd = world.atmosphere.keyLightDir;
    const CAMOFF = world.camera.offset || 8.5;      // projection distance shared with the 3D rail
    let W = 0, H = 0, dpr = 1, LOOK = look;
    let grain = null, fgOff = null, fgCtx = null;
    let facEase = 1, lastT = null;                  // eased facing (matches 3D yaw ease)

    // look-derived caches (rebuilt in setLook)
    let bloomMul = 1, dofEntry = null, grainEntry = null, vigEntry = null, emissive = 0.25;
    function digestLook() {
      bloomMul = 0.6; dofEntry = null; grainEntry = null; vigEntry = null;
      for (const fx of LOOK.post) {
        if (fx.type === "bloom") bloomMul = fx.strength * 1.4;
        else if (fx.type === "dof") dofEntry = fx;
        else if (fx.type === "grain") grainEntry = fx;
        else if (fx.type === "vignette") vigEntry = fx;
      }
      emissive = LOOK.material ? LOOK.material.emissive : 0.25;
    }

    // ---- projection: side view on the SHARED dolly rail ----
    let PPU = 158, groundY = 0, camLeft = 0;
    const SX = (worldX) => (worldX - camLeft) * PPU;
    const groundLineY = (worldX) => groundY - runtime.groundAt(worldX) * PPU;
    // parallax factor from true projection geometry: how much slower a plane
    // at depth z appears to move than the play plane (both adapters' z)
    const pf = (z) => CAMOFF / (CAMOFF + Math.abs(z));

    function buildGrain() {
      grain = document.createElement("canvas"); grain.width = grain.height = 128;
      const g = grain.getContext("2d"), im = g.createImageData(128, 128);
      let s = 0x9e37;
      for (let i = 0; i < im.data.length; i += 4) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const v = 120 + (s % 90);
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    }

    // ---- painters ----
    function drawSky(fr) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, shade(P.sky, 0.7));
      g.addColorStop(0.55, P.sky);
      g.addColorStop(1, mix(P.sky, P.ground, 0.5));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sky is NEAR-STATIONARY: only a small bounded drift with camera
      // progress (raw parallax would scroll the moon off over a full walk)
      const drift = (camLeft / Math.max(runtime.len, 1)) * W * 0.1 * LOOK.camera.parallax;
      const mx = W * 0.74 - drift, my = H * 0.2;
      const halo = ctx.createRadialGradient(mx, my, 6, mx, my, H * 0.28 * (0.8 + bloomMul * 0.2));
      halo.addColorStop(0, rgba(P.moonHalo, 0.42 * (LOOK.lighting.keyIntensity / 2.4) * (0.7 + bloomMul * 0.3)));
      halo.addColorStop(1, rgba(P.moonHalo, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, H * 0.28 * (0.8 + bloomMul * 0.2), 0, TAU); ctx.fill();
      ctx.fillStyle = mix(P.moon, LOOK.lighting.moonColorMul, 0.4);
      ctx.beginPath(); ctx.arc(mx, my, H * 0.035, 0, TAU); ctx.fill();
      ctx.fillStyle = P.moon;
      for (const s of fr.particles.stars) {
        ctx.globalAlpha = runtime.reduce ? 0.7 : 0.4 + 0.5 * Math.abs(Math.sin(fr.t * 0.6 + s.ph));
        ctx.beginPath(); ctx.arc(s.u * W - drift * 0.8, s.v * H * 0.55, s.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // aurora — an ENVIRONMENT painter (not a prop): additive vertical curtains
    // in the upper third of the sky, waving over time; frozen under reduced-
    // motion (draws a static composed still when runtime.reduce).
    function drawAurora(fr) {
      const t = runtime.reduce ? 0 : fr.t;
      const cols = [P.aurora, P.aurora2, P.aurora];    // teal / violet / teal curtains
      const baseY = H * 0.05;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let band = 0; band < cols.length; band++) {
        const yTop = baseY + band * H * 0.045;
        const bandH = H * 0.2;
        const amp = H * 0.035 * (1 - band * 0.15);
        const wob = t * 0.25 + band * 1.7;
        ctx.beginPath();
        for (let sx = 0; sx <= W; sx += 14) {
          const y = yTop + Math.sin(sx * 0.005 + wob) * amp + Math.sin(sx * 0.013 + wob * 1.6) * amp * 0.4;
          sx === 0 ? ctx.moveTo(sx, y) : ctx.lineTo(sx, y);
        }
        for (let sx = W; sx >= 0; sx -= 14) {
          const y = yTop + bandH + Math.sin(sx * 0.005 + wob) * amp * 0.6;
          ctx.lineTo(sx, y);
        }
        ctx.closePath();
        const g = ctx.createLinearGradient(0, yTop, 0, yTop + bandH);
        g.addColorStop(0, rgba(cols[band], 0));
        g.addColorStop(0.35, rgba(cols[band], 0.22 * (0.6 + bloomMul * 0.4)));
        g.addColorStop(1, rgba(cols[band], 0));
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.restore();
    }
    function distanceLayer(layer) {
      // the SAME runtime-owned profile the 3D adapter samples (§0: no layout
      // math in adapters), projected by true depth geometry
      const f = pf(layer.z) * LOOK.camera.parallax + (1 - LOOK.camera.parallax) * 1;
      const horizon = lerp(groundY, H * 0.3, clamp(layer.z / 100, 0, 1));
      ctx.fillStyle = P[layer.paletteRole] || P.hills;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 6) {
        const gx = camLeft * f + sx / PPU;
        const prof = runtime.layerProfileAt(layer, gx);   // world units
        ctx.lineTo(sx, horizon - prof * PPU * pf(layer.z) * 0.9);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      const hz = ctx.createLinearGradient(0, horizon - H * 0.1, 0, groundY);
      hz.addColorStop(0, rgba(P.sky, 0));
      hz.addColorStop(1, rgba(P.sky, clamp(0.55 * (1 - pf(layer.z)) + 0.12, 0, 0.7) * LOOK.fog.densityMul));
      ctx.fillStyle = hz; ctx.fillRect(0, horizon - H * 0.1, W, groundY - horizon + H * 0.1);
    }
    function drawGround() {
      // ambient level lifts the ground floor slightly (no light model, §2.5)
      ctx.fillStyle = mix(P.ground, "#ffffff", clamp(LOOK.lighting.ambient - 0.25, 0, 1) * 0.08);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 8) ctx.lineTo(sx, groundLineY(camLeft + sx / PPU));
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      // cool blue-shadow bands drifting across the snow (toward P.hills)
      ctx.fillStyle = rgba(P.hills, 0.1);
      const bandW = 1.3;
      for (let wx = Math.floor(camLeft / bandW) * bandW; wx < camLeft + W / PPU; wx += bandW) {
        const b1 = Math.abs(Math.sin(wx * 9.7) * 2531) % 1;
        if (b1 > 0.55) continue;
        ctx.beginPath(); ctx.ellipse(SX(wx), groundLineY(wx) + 14 + b1 * 30, 40 + b1 * 70, 5 + b1 * 6, 0, 0, TAU); ctx.fill();
      }
      // bright cold sparkle speckle (snow crystals, toward P.snowLit)
      ctx.fillStyle = rgba(P.snowLit, 0.06 * (0.4 + (LOOK.canvasHints.textureBlend || 0.4) * 1.5));
      const stepW = 0.5;
      for (let wx = Math.floor(camLeft / stepW) * stepW; wx < camLeft + W / PPU; wx += stepW) {
        const h1 = Math.abs(Math.sin(wx * 71.9) * 4373) % 1, h2 = Math.abs(Math.sin(wx * 12.3) * 1251) % 1;
        const sx = SX(wx + h1 * 0.3), sy = groundLineY(wx) + 6 + h2 * 26;
        ctx.beginPath(); ctx.ellipse(sx, sy, 2.4 + h1 * 3, 1 + h2 * 1.4, 0, 0, TAU); ctx.fill();
      }
      for (const p of frameRef.props) {
        if (p.activation < 0.03) continue;   // ANY light-reactive prop glows the ground (E2, world-agnostic)
        const sx = SX(p.x), sy = groundLineY(p.x) + 4;
        if (sx < -200 || sx > W + 200) continue;
        const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 150 * p.activation);
        g.addColorStop(0, rgba(P.propGlow, 0.14 * p.activation * (0.6 + emissive)));
        g.addColorStop(1, rgba(P.propGlow, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(sx, sy, 150, 40, 0, 0, TAU); ctx.fill();
      }
    }

    function contactShadow(sx, sy, r, lift) {
      // higher ambient = softer, fainter shadows (physically sensible fake)
      const soft = LOOK.lighting.shadowSoftness, amb = clamp(1 - (LOOK.lighting.ambient - 0.25), 0.4, 1);
      const g = ctx.createRadialGradient(sx - kd[0] * r, sy, 1, sx - kd[0] * r, sy, r * (1 + soft * 0.05));
      g.addColorStop(0, rgba(LOOK.lighting.shadowColor, LOOK.lighting.shadowDarkness * 0.5 * amb * clamp(1 - lift, 0.3, 1)));
      g.addColorStop(1, rgba(LOOK.lighting.shadowColor, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(sx - kd[0] * r * 0.6, sy, r * (1 + soft * 0.05), r * 0.32, 0, 0, TAU); ctx.fill();
    }

    function drawLantern(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 2, 46 * p.scale, 0);
      ctx.strokeStyle = shade(P.trunk, 0.7); ctx.lineWidth = 4 * sc; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx, gy - 118 * sc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, gy - 118 * sc); ctx.lineTo(sx + 26 * sc, gy - 108 * sc); ctx.stroke();
      const lx = sx + 26 * sc, ly = gy - 96 * sc;
      if (p.activation > 0.03) {
        const rr = 70 * sc * p.activation * (LOOK.canvasHints.haloStrength || 1) * (0.6 + bloomMul * 0.4);
        const halo = ctx.createRadialGradient(lx, ly, 2, lx, ly, rr);
        halo.addColorStop(0, rgba(P.propGlow, 0.55 * p.activation * (0.6 + emissive)));
        halo.addColorStop(1, rgba(P.propGlow, 0));
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(lx, ly, rr, 0, TAU); ctx.fill();
      }
      const lit = ctx.createRadialGradient(lx, ly - 3 * sc, 1, lx, ly, 14 * sc);
      lit.addColorStop(0, p.activation > 0.4 ? "#ffe9b8" : P.propPaper);
      lit.addColorStop(1, p.activation > 0.4 ? P.propPaper : shade(P.propPaper, 0.55));
      ctx.fillStyle = lit;
      ctx.beginPath(); ctx.ellipse(lx, ly, 10 * sc, 13 * sc, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(P.trunk, 0.6);
      ctx.fillRect(lx - 6 * sc, ly - 15 * sc, 12 * sc, 3.5 * sc);
      ctx.fillRect(lx - 5 * sc, ly + 12 * sc, 10 * sc, 3 * sc);
    }
    function drawTree(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      ctx.strokeStyle = P.trunk; ctx.lineCap = "round"; ctx.lineWidth = 10 * sc;
      ctx.beginPath(); ctx.moveTo(sx, gy); ctx.quadraticCurveTo(sx - 8 * sc, gy - 90 * sc, sx + 6 * sc, gy - 150 * sc); ctx.stroke();
      const cg = ctx.createRadialGradient(sx + 10 * sc, gy - 190 * sc, 6, sx, gy - 175 * sc, 90 * sc);
      cg.addColorStop(0, mix(P.canopy, "#ffffff", 0.12)); cg.addColorStop(1, shade(P.canopy, 0.75));
      ctx.fillStyle = cg;
      [[-40, -195, 46], [22, -215, 54], [58, -180, 40], [0, -175, 44]].forEach(([bx, by, br]) => {
        ctx.beginPath(); ctx.arc(sx + bx * sc, gy + by * sc, br * sc, 0, TAU); ctx.fill();
      });
      const rng = mulberry(p.seed);
      for (let i = 0; i < 20; i++) {
        const a = rng() * TAU, r = (40 + rng() * 45) * sc;
        ctx.fillStyle = P.blossom[i % P.blossom.length]; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(sx + Math.cos(a) * r + 14 * sc, gy - 190 * sc + Math.sin(a) * r * 0.7, (2 + i % 3) * sc, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function drawTorii(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02, w2 = 62 * sc, h = 150 * sc;
      contactShadow(sx, gy + 2, 80 * p.scale, 0);
      ctx.strokeStyle = P.torii; ctx.lineCap = "round"; ctx.lineWidth = 11 * sc;
      ctx.beginPath(); ctx.moveTo(sx - w2, gy); ctx.lineTo(sx - w2 + 7 * sc, gy - h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx + w2, gy); ctx.lineTo(sx + w2 - 7 * sc, gy - h); ctx.stroke();
      ctx.lineWidth = 9 * sc;
      ctx.beginPath(); ctx.moveTo(sx - w2 - 10 * sc, gy - h * 0.72); ctx.lineTo(sx + w2 + 10 * sc, gy - h * 0.72); ctx.stroke();
      ctx.strokeStyle = shade(P.torii, 0.7); ctx.lineWidth = 13 * sc;
      ctx.beginPath(); ctx.moveTo(sx - w2 - 22 * sc, gy - h + 4 * sc);
      ctx.quadraticCurveTo(sx, gy - h - 14 * sc, sx + w2 + 22 * sc, gy - h + 4 * sc); ctx.stroke();
    }
    function drawRock(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 1, 18 * p.scale, 0);
      const g = ctx.createLinearGradient(sx - 16 * sc, gy - 20 * sc, sx + 16 * sc, gy);
      g.addColorStop(0, P.rock || "#3a3048"); g.addColorStop(1, P.rockShade || "#241b2e");   // palette-driven (E3)
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(sx, gy - 6 * sc, 16 * sc, 10 * sc, 0, Math.PI, TAU); ctx.fill();
    }

    // ---- desert prop TYPES (§6.4 seam: one draw per adapter per new type) ----
    function drawCactus(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 1, 30 * p.scale, 0);
      const bodyGrad = ctx.createLinearGradient(sx - 20 * sc, 0, sx + 20 * sc, 0);
      bodyGrad.addColorStop(0, shade(P.cactusBody || "#5e7d52", 0.7));
      bodyGrad.addColorStop(0.45, P.cactusBody || "#5e7d52");
      bodyGrad.addColorStop(1, P.cactusShade || "#3f5a38");
      ctx.strokeStyle = bodyGrad; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const H = 150 * sc, w = 15 * sc;
      ctx.lineWidth = w * 2;
      ctx.beginPath(); ctx.moveTo(sx, gy - w); ctx.lineTo(sx, gy - H); ctx.stroke();   // trunk (round cap = domed top)
      ctx.lineWidth = 10 * sc;                                                          // upcurved arms
      [[1, 0.5, 0.6], [-1, 0.4, 0.48]].forEach(([side, hf, len]) => {
        const ey = gy - H * hf, bx = sx + side * 34 * sc;
        ctx.beginPath(); ctx.moveTo(sx + side * 3 * sc, ey);
        ctx.quadraticCurveTo(bx, ey, bx, ey - 6 * sc); ctx.lineTo(bx, ey - H * len); ctx.stroke();
      });
      ctx.strokeStyle = rgba("255,255,255", 0.06); ctx.lineWidth = 1.5 * sc;            // rib highlights
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(sx + i * 5 * sc, gy - w); ctx.lineTo(sx + i * 5 * sc, gy - H + 6 * sc); ctx.stroke(); }
      const rng = mulberry(p.seed);                                                     // cream crown flowers (the shed source)
      for (let i = 0; i < 5; i++) {
        const a = rng() * TAU, r = (8 + rng() * 6) * sc;
        ctx.fillStyle = P.blossom[i % P.blossom.length];
        ctx.beginPath(); ctx.arc(sx + Math.cos(a) * r, gy - H + Math.sin(a) * r * 0.7, (2 + rng() * 2) * sc, 0, TAU); ctx.fill();
      }
    }
    function drawCampfire(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 1, 26 * p.scale, 0);
      const rng = mulberry(p.seed), stoneCol = P.rock || "#8a7a5e";
      for (let i = 0; i < 6; i++) {                                                      // front-facing stone ring
        const a = Math.PI + (i / 5) * Math.PI, ox = Math.cos(a) * 22 * sc, oy = -Math.sin(a) * 7 * sc;
        ctx.fillStyle = i % 2 ? shade(stoneCol, 0.8) : stoneCol;
        ctx.beginPath(); ctx.ellipse(sx + ox, gy + oy, (6 + rng() * 2) * sc, 4.5 * sc, 0, 0, TAU); ctx.fill();
      }
      ctx.strokeStyle = P.trunk || "#6b4a2e"; ctx.lineCap = "round"; ctx.lineWidth = 6 * sc;   // crossed logs
      ctx.beginPath(); ctx.moveTo(sx - 16 * sc, gy - 2 * sc); ctx.lineTo(sx + 16 * sc, gy - 9 * sc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx - 16 * sc, gy - 9 * sc); ctx.lineTo(sx + 16 * sc, gy - 2 * sc); ctx.stroke();
      const act = p.activation;
      // unlit read MIRRORS the 3D adapter: a small dark ember cone is always
      // present (only glow/flames are activation-gated) — review-confirmed
      // read-divergence otherwise: 3D showed dark kindling, canvas nothing
      ctx.fillStyle = "#2a1509";
      ctx.beginPath(); ctx.moveTo(sx - 6 * sc, gy - 5 * sc);
      ctx.quadraticCurveTo(sx, gy - 17 * sc, sx + 6 * sc, gy - 5 * sc); ctx.closePath(); ctx.fill();
      if (act > 0.03) {                                                                 // flame + glow only once lit
        const rr = 60 * sc * act * (LOOK.canvasHints.haloStrength || 1) * (0.6 + bloomMul * 0.4);
        const halo = ctx.createRadialGradient(sx, gy - 16 * sc, 2, sx, gy - 16 * sc, rr);
        halo.addColorStop(0, rgba(P.propGlow, 0.5 * act * (0.6 + emissive))); halo.addColorStop(1, rgba(P.propGlow, 0));
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, gy - 16 * sc, rr, 0, TAU); ctx.fill();
        const fl = runtime.reduce ? 0 : Math.sin(frameRef.t * 9 + p.x) * 0.4;           // flicker (frozen in reduced-motion)
        [[0, 1, P.propPaper], [-0.35, 0.72, mix(P.propPaper, P.propGlow, 0.5)], [0.35, 0.66, mix(P.propPaper, P.propGlow, 0.4)]].forEach(([off, h, col]) => {
          const bx = sx + off * 10 * sc, topY = gy - (10 + 26 * h * act) * sc;
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - 5 * sc, gy - 6 * sc);
          ctx.quadraticCurveTo(bx - 4 * sc + fl * 3 * sc, gy - 20 * sc * h, bx + fl * 4 * sc, topY);
          ctx.quadraticCurveTo(bx + 4 * sc - fl * 3 * sc, gy - 20 * sc * h, bx + 5 * sc, gy - 6 * sc); ctx.closePath(); ctx.fill();
        });
        ctx.fillStyle = act > 0.4 ? "#fff2c0" : P.propPaper;                            // hot core
        ctx.beginPath(); ctx.ellipse(sx, gy - 8 * sc, 6 * sc, 4 * sc, 0, 0, TAU); ctx.fill();
      }
    }
    function drawSkull(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 1, 20 * p.scale, 0.2);
      const bone = P.bone || "#e8ddc4", boneSh = P.boneShade || "#b6a888";
      ctx.strokeStyle = boneSh; ctx.lineCap = "round"; ctx.lineWidth = 5 * sc;          // curved horns
      [-1, 1].forEach((side) => {
        ctx.beginPath(); ctx.moveTo(sx + side * 8 * sc, gy - 20 * sc);
        ctx.quadraticCurveTo(sx + side * 30 * sc, gy - 26 * sc, sx + side * 40 * sc, gy - 14 * sc); ctx.stroke();
      });
      const g = ctx.createLinearGradient(0, gy - 28 * sc, 0, gy);                       // cranium (half-buried)
      g.addColorStop(0, bone); g.addColorStop(1, boneSh); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(sx - 13 * sc, gy);
      ctx.quadraticCurveTo(sx - 15 * sc, gy - 24 * sc, sx, gy - 26 * sc);
      ctx.quadraticCurveTo(sx + 15 * sc, gy - 24 * sc, sx + 13 * sc, gy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx, gy - 4 * sc, 6 * sc, 8 * sc, 0, 0, Math.PI); ctx.fill();  // snout
      ctx.fillStyle = shade(boneSh, 0.45);                                             // eye sockets
      [-1, 1].forEach((side) => { ctx.beginPath(); ctx.ellipse(sx + side * 6 * sc, gy - 14 * sc, 3.2 * sc, 4 * sc, 0, 0, TAU); ctx.fill(); });
    }
    function drawArch(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 2, 90 * p.scale, 0);
      const arch = P.arch || "#c0895a", archSh = P.archShade || "#8a5f38";
      const w2 = 44 * sc, H = 115 * sc, th = 14 * sc;    // slimmer than a torii post so it reads as a gateway arch
      const g = ctx.createLinearGradient(sx - w2, gy - H, sx + w2, gy);
      g.addColorStop(0, arch); g.addColorStop(1, archSh); ctx.fillStyle = g;
      ctx.beginPath();                                                                  // left leg (tapered)
      ctx.moveTo(sx - w2 - th, gy); ctx.lineTo(sx - w2 - th, gy - H * 0.74);
      ctx.lineTo(sx - w2, gy - H * 0.8); ctx.lineTo(sx - w2, gy); ctx.closePath(); ctx.fill();
      ctx.beginPath();                                                                  // right leg
      ctx.moveTo(sx + w2, gy); ctx.lineTo(sx + w2, gy - H * 0.8);
      ctx.lineTo(sx + w2 + th, gy - H * 0.74); ctx.lineTo(sx + w2 + th, gy); ctx.closePath(); ctx.fill();
      ctx.beginPath();                                                                  // spanning arch band (crescent)
      ctx.moveTo(sx - w2 - th, gy - H * 0.72);
      ctx.quadraticCurveTo(sx, gy - H - 6 * sc, sx + w2 + th, gy - H * 0.72);
      ctx.lineTo(sx + w2, gy - H * 0.72);
      ctx.quadraticCurveTo(sx, gy - H + th, sx - w2, gy - H * 0.72); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(archSh, 0.4); ctx.lineWidth = 1.5 * sc;                    // erosion banding
      for (let i = 1; i < 4; i++) { const yy = gy - H * 0.16 * i; ctx.beginPath(); ctx.moveTo(sx - w2 - th, yy); ctx.lineTo(sx - w2, yy); ctx.moveTo(sx + w2, yy); ctx.lineTo(sx + w2 + th, yy); ctx.stroke(); }
    }
    // ---- alpine prop TYPES (§6.4 seam: one draw per adapter per new type) ----
    function drawPine(p) {
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 2, 40 * p.scale, 0);
      ctx.strokeStyle = shade(P.trunk, 0.85); ctx.lineCap = "round"; ctx.lineWidth = 7 * sc;   // slim trunk
      ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx, gy - 150 * sc); ctx.stroke();
      const needle = ctx.createLinearGradient(sx - 46 * sc, 0, sx + 46 * sc, 0);                // wide→dark needle sheen
      needle.addColorStop(0, mix(P.canopy, "#ffffff", 0.1));
      needle.addColorStop(1, shade(P.canopy, 0.7));
      ctx.fillStyle = needle;
      [[64, 150], [54, 118], [42, 88]].forEach(([halfW, baseY]) => {                            // three triangular skirts (wide bottom → narrow top)
        const by = gy - baseY * sc, apex = gy - (baseY + 52) * sc;
        ctx.beginPath(); ctx.moveTo(sx - halfW * sc, by); ctx.lineTo(sx, apex); ctx.lineTo(sx + halfW * sc, by); ctx.closePath(); ctx.fill();
      });
      const rng = mulberry(p.seed);                                                             // seeded snow caps on the boughs
      ctx.fillStyle = rgba(P.snowLit, 0.85);
      for (let i = 0; i < 12; i++) {
        const a = rng() * TAU, r = (10 + rng() * 46) * sc;
        ctx.beginPath(); ctx.arc(sx + Math.cos(a) * r, gy - (78 + rng() * 92) * sc, (2 + rng() * 2) * sc, 0, TAU); ctx.fill();
      }
    }
    function drawCabin(p) {   // LIGHTABLE: amber windows latch on as the shepherd passes
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 2, 90 * p.scale, 0);
      const wallW = 70 * sc, wallH = 62 * sc;
      const wall = ctx.createLinearGradient(sx - wallW, 0, sx + wallW, 0);                       // log wall
      wall.addColorStop(0, P.cabin); wall.addColorStop(1, shade(P.cabin, 0.7));
      ctx.fillStyle = wall; ctx.fillRect(sx - wallW, gy - wallH, wallW * 2, wallH);
      ctx.strokeStyle = shade(P.cabin, 0.55); ctx.lineWidth = 1.5 * sc;                          // log seams
      for (let i = 1; i < 5; i++) { const yy = gy - wallH + (wallH / 5) * i; ctx.beginPath(); ctx.moveTo(sx - wallW, yy); ctx.lineTo(sx + wallW, yy); ctx.stroke(); }
      ctx.fillStyle = P.cabinRoof;                                                               // pitched roof
      ctx.beginPath(); ctx.moveTo(sx - wallW - 12 * sc, gy - wallH);
      ctx.lineTo(sx, gy - wallH - 42 * sc); ctx.lineTo(sx + wallW + 12 * sc, gy - wallH); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.snow;                                                                    // bright snow layer on the ridge
      ctx.beginPath();
      ctx.moveTo(sx - wallW - 12 * sc, gy - wallH + 1 * sc);
      ctx.lineTo(sx, gy - wallH - 42 * sc);
      ctx.lineTo(sx + wallW + 12 * sc, gy - wallH + 1 * sc);
      ctx.lineTo(sx + wallW + 4 * sc, gy - wallH + 6 * sc);
      ctx.lineTo(sx, gy - wallH - 31 * sc);
      ctx.lineTo(sx - wallW - 4 * sc, gy - wallH + 6 * sc);
      ctx.closePath(); ctx.fill();
      const winY = gy - wallH * 0.55;                                                            // two amber windows (gated on activation)
      [-0.44, 0.44].forEach((off) => {
        const wx = sx + off * wallW, ww = 16 * sc, wh = 20 * sc;
        if (p.activation > 0.03) {
          const rr = 62 * sc * p.activation * (LOOK.canvasHints.haloStrength || 1) * (0.6 + bloomMul * 0.4);
          const halo = ctx.createRadialGradient(wx, winY, 2, wx, winY, rr);
          halo.addColorStop(0, rgba(P.propGlow, 0.5 * p.activation * (0.6 + emissive)));
          halo.addColorStop(1, rgba(P.propGlow, 0));
          ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(wx, winY, rr, 0, TAU); ctx.fill();
        }
        const lit = ctx.createRadialGradient(wx, winY - wh * 0.2, 1, wx, winY, wh);
        lit.addColorStop(0, p.activation > 0.4 ? "#ffe9b8" : shade(P.propPaper, 0.5));
        lit.addColorStop(1, p.activation > 0.4 ? P.propPaper : shade(P.propPaper, 0.35));
        ctx.fillStyle = lit; ctx.fillRect(wx - ww / 2, winY - wh / 2, ww, wh);
        ctx.strokeStyle = shade(P.cabin, 0.5); ctx.lineWidth = 2 * sc;                           // muntins
        ctx.beginPath(); ctx.moveTo(wx, winY - wh / 2); ctx.lineTo(wx, winY + wh / 2);
        ctx.moveTo(wx - ww / 2, winY); ctx.lineTo(wx + ww / 2, winY); ctx.stroke();
      });
    }
    function drawChairlift(p) {   // LIGHTABLE: small amber lamp latches on as the shepherd passes
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      contactShadow(sx, gy + 2, 30 * p.scale, 0);
      const topY = gy - 205 * sc;
      ctx.strokeStyle = shade(P.rock, 0.9); ctx.lineCap = "round"; ctx.lineWidth = 6 * sc;       // pylon
      ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx, topY); ctx.stroke();
      ctx.lineWidth = 4 * sc;                                                                    // cross arm
      ctx.beginPath(); ctx.moveTo(sx - 26 * sc, topY + 6 * sc); ctx.lineTo(sx + 26 * sc, topY + 6 * sc); ctx.stroke();
      ctx.strokeStyle = rgba(P.snowLit, 0.5); ctx.lineWidth = 1.5 * sc;                          // short cable stub
      ctx.beginPath(); ctx.moveTo(sx - 130 * sc, topY); ctx.quadraticCurveTo(sx, topY + 12 * sc, sx + 130 * sc, topY); ctx.stroke();
      const cx = sx + 62 * sc, cy = topY + 10 * sc;                                              // one hanging chair
      ctx.strokeStyle = shade(P.trunk, 0.9); ctx.lineWidth = 2.5 * sc;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 22 * sc); ctx.stroke();
      ctx.fillStyle = P.rock;
      ctx.fillRect(cx - 11 * sc, cy + 22 * sc, 22 * sc, 6 * sc);
      ctx.fillRect(cx - 11 * sc, cy + 12 * sc, 3 * sc, 16 * sc);                                 // seat back
      const lx = sx, ly = topY + 6 * sc;                                                         // amber tower lamp (gated)
      if (p.activation > 0.03) {
        const rr = 56 * sc * p.activation * (LOOK.canvasHints.haloStrength || 1) * (0.6 + bloomMul * 0.4);
        const halo = ctx.createRadialGradient(lx, ly, 2, lx, ly, rr);
        halo.addColorStop(0, rgba(P.propGlow, 0.5 * p.activation * (0.6 + emissive)));
        halo.addColorStop(1, rgba(P.propGlow, 0));
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(lx, ly, rr, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = p.activation > 0.4 ? "#ffe9b8" : shade(P.propPaper, 0.5);
      ctx.beginPath(); ctx.arc(lx, ly, 5 * sc, 0, TAU); ctx.fill();
    }
    function drawFrozenLake(p) {   // low, wide, recessed ice sheet — faked sheen, reflects nothing literal
      const sx = SX(p.x), gy = groundLineY(p.x), sc = p.scale * PPU * 0.02;
      const rw = 150 * sc, rh = 26 * sc;
      const ice = ctx.createLinearGradient(0, gy - rh, 0, gy + rh);                              // cold vertical gradient
      ice.addColorStop(0, mix(P.lakeIce, "#ffffff", 0.22));
      ice.addColorStop(1, shade(P.lakeIce, 0.7));
      ctx.fillStyle = ice; ctx.beginPath(); ctx.ellipse(sx, gy, rw, rh, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.ellipse(sx, gy, rw, rh, 0, 0, TAU); ctx.clip();
      const streakX = sx - kd[0] * rw * 0.35;                                                    // specular streak toward the moon (kd[0])
      const spec = ctx.createLinearGradient(streakX - 30 * sc, 0, streakX + 30 * sc, 0);
      spec.addColorStop(0, rgba(P.moonHalo, 0));
      spec.addColorStop(0.5, rgba(P.moonHalo, 0.28 * (LOOK.lighting.keyIntensity / 2.4)));
      spec.addColorStop(1, rgba(P.moonHalo, 0));
      ctx.fillStyle = spec; ctx.fillRect(streakX - 30 * sc, gy - rh, 60 * sc, rh * 2);
      ctx.strokeStyle = rgba(P.snowLit, 0.35); ctx.lineWidth = 1.4 * sc;                         // a couple of faint bright streaks (seeded)
      const rng = mulberry(p.seed);
      for (let i = 0; i < 3; i++) {
        const yy = gy + (rng() - 0.5) * rh * 1.2, x0 = sx - rw * (0.3 + rng() * 0.4);
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + rw * (0.3 + rng() * 0.5), yy + (rng() - 0.5) * 4 * sc); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = rgba(P.snowLit, 0.5); ctx.lineWidth = 1.5 * sc;                          // thin bright rim
      ctx.beginPath(); ctx.ellipse(sx, gy, rw, rh, 0, 0, TAU); ctx.stroke();
    }
    const PROP = { "paper-lantern": drawLantern, "cherry-tree": drawTree, "torii": drawTorii, "rock": drawRock,
                   "cactus": drawCactus, "campfire": drawCampfire, "skull": drawSkull, "arch": drawArch,
                   // alpine: 4 new draws + 2 aliases (trail-lantern → lantern factory keeps the
                   // activation-gated glow + latch for free; trail-gate → torii timber gate).
                   "pine": drawPine, "cabin": drawCabin, "chairlift": drawChairlift, "frozen-lake": drawFrozenLake,
                   "trail-lantern": drawLantern, "trail-gate": drawTorii };

    // ---- the fox, drawn from the shared anatomy pose ----
    function foxPoint(rootX, lx, ly, fac) {
      return [SX(rootX + fac * lx * RS), groundLineY(rootX) - ly * RS * PPU];
    }
    function drawLimb(chain, rootX, fac, furCol) {
      const pts = chain.points.map((pt) => foxPoint(rootX, pt.x, pt.y, fac));
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = furCol; ctx.lineWidth = chain.radii[0] * RS * PPU * 2;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.stroke();
      ctx.lineWidth = chain.radii[1] * RS * PPU * 2;
      ctx.beginPath(); ctx.moveTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.stroke();
      ctx.strokeStyle = P.protagInk; ctx.lineWidth = chain.radii[2] * RS * PPU * 2;
      ctx.beginPath(); ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); ctx.stroke();
      ctx.fillStyle = P.protagInk;
      ctx.beginPath(); ctx.ellipse(pts[3][0], pts[3][1], chain.radii[2] * RS * PPU * 1.4, chain.radii[2] * RS * PPU, 0, 0, TAU); ctx.fill();
    }
    function drawFox(fr, dt) {
      const pr = fr.protagonist, pose = pr.pose, rootX = pr.root[0];
      // eased facing — the mirror is a motion, matching the 3D yaw ease
      facEase = lerp(facEase, pr.facing >= 0 ? 1 : -1, ksm(0.14, dt));
      const fac = Math.abs(facEase) < 0.08 ? (facEase < 0 ? -0.08 : 0.08) : facEase;
      const gy = groundLineY(rootX);
      const bodyTop = gy - 1.1 * RS * PPU;
      // shepherd coat: sable saddle over the back (TOP) grading to tan flanks (bottom)
      const FUR = ctx.createLinearGradient(0, bodyTop, 0, gy);
      FUR.addColorStop(0, P.protagDark);
      FUR.addColorStop(0.42, mix(P.protagDark, P.protagFur, 0.5));
      FUR.addColorStop(1, P.protagFur);
      contactShadow(SX(rootX), gy + 2, 40 * RS, Math.abs(pose.bob) * 0.3);
      drawLimb(pose.limbs.hindFar, rootX, fac, shade(P.protagDark, 0.85));
      drawLimb(pose.limbs.foreFar, rootX, fac, shade(P.protagDark, 0.85));
      // tail
      ctx.fillStyle = FUR;
      ctx.beginPath();
      const tp = pose.tail.map((pt) => foxPoint(rootX, pt.x, pt.y, fac));
      ctx.moveTo(tp[0][0], tp[0][1] - 9);                     // bushier, low-carried tail (widened ribbon)
      for (let i = 1; i < tp.length; i++) ctx.lineTo(tp[i][0], tp[i][1] - 8);
      for (let i = tp.length - 1; i >= 0; i--) ctx.lineTo(tp[i][0], tp[i][1] + 11);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.protagInk;                            // black tail tip
      const tip = tp[tp.length - 1];
      ctx.beginPath(); ctx.ellipse(tip[0], tip[1], 9 * RS, 7 * RS, 0, 0, TAU); ctx.fill();
      // body silhouette (kept as a path so the outline pass can re-stroke it)
      const bp = (lx, ly) => foxPoint(rootX, lx, ly, fac);
      const outline = LOOK.material && LOOK.material.outline && LOOK.material.outline.enabled;
      ctx.fillStyle = FUR;
      ctx.beginPath();
      // shepherd topline: high withers (front, +x) sloping down to a low croup (rear, -x)
      const B = [[-0.62, 0.95], [-0.5, 1.18], [0.1, 1.4], [0.55, 1.4], [0.72, 1.02], [0.6, 0.72], [0.1, 0.6], [-0.4, 0.64], [-0.66, 0.78]];
      const b0 = bp(B[0][0], B[0][1]); ctx.moveTo(b0[0], b0[1]);
      for (let i = 1; i < B.length; i++) { const q = bp(B[i][0], B[i][1]); ctx.lineTo(q[0], q[1]); }
      ctx.closePath(); ctx.fill();
      if (outline) {                                  // storybook ink line (§2.5 material.outline)
        ctx.strokeStyle = LOOK.material.outline.color;
        ctx.lineWidth = Math.max(1, LOOK.material.outline.thickness * PPU * (LOOK.canvasHints.inkWidth || 1));
        ctx.stroke();
      }
      ctx.fillStyle = rgba(P.protagFur, 0.5);
      let h = bp(-0.5, 1.0); ctx.beginPath(); ctx.ellipse(h[0], h[1], 0.34 * RS * PPU, 0.4 * RS * PPU, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = P.protagCream;
      let c = bp(0.5, 0.82); ctx.beginPath(); ctx.ellipse(c[0], c[1], 0.2 * RS * PPU, 0.28 * RS * PPU, -0.4 * fac, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba("#ffecc8", 0.4 * (LOOK.lighting.keyIntensity / 2.4)); ctx.lineWidth = 2;
      let r0 = bp(-0.5, 1.18), r1 = bp(0.1, 1.4), r2 = bp(0.55, 1.4);
      ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.quadraticCurveTo(r1[0], r1[1] - 2, r2[0], r2[1]); ctx.stroke();
      drawLimb(pose.limbs.hindNear, rootX, fac, FUR);
      drawLimb(pose.limbs.foreNear, rootX, fac, FUR);
      // head
      const hc = pose.headC, gaze = pr.gaze;
      const hs = bp(hc.x + gaze[0] * 0.06, hc.y + gaze[1] * 0.04);
      ctx.save();
      ctx.translate(hs[0], hs[1]); ctx.scale(fac, 1);
      const HR = RS * PPU;
      ctx.fillStyle = FUR;
      ctx.beginPath(); ctx.moveTo(-0.06 * HR, -0.05 * HR); ctx.quadraticCurveTo(-0.1 * HR, -0.34 * HR, -0.02 * HR, -0.42 * HR);
      ctx.quadraticCurveTo(0.04 * HR, -0.2 * HR, 0.02 * HR, -0.05 * HR); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0.08 * HR, -0.06 * HR); ctx.quadraticCurveTo(0.06 * HR, -0.36 * HR, 0.16 * HR, -0.4 * HR);
      ctx.quadraticCurveTo(0.18 * HR, -0.18 * HR, 0.14 * HR, -0.05 * HR); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.protagInk;
      ctx.beginPath(); ctx.moveTo(0.1 * HR, -0.33 * HR); ctx.lineTo(0.16 * HR, -0.4 * HR); ctx.lineTo(0.17 * HR, -0.3 * HR); ctx.closePath(); ctx.fill();
      ctx.fillStyle = FUR;
      ctx.beginPath();
      ctx.moveTo(-0.16 * HR, -0.02 * HR);
      ctx.bezierCurveTo(-0.14 * HR, -0.2 * HR, 0.04 * HR, -0.24 * HR, 0.14 * HR, -0.18 * HR);
      ctx.bezierCurveTo(0.24 * HR, -0.12 * HR, 0.34 * HR, -0.04 * HR, 0.42 * HR, 0.02 * HR);
      ctx.bezierCurveTo(0.3 * HR, 0.08 * HR, 0.14 * HR, 0.1 * HR, 0.02 * HR, 0.09 * HR);
      ctx.bezierCurveTo(-0.1 * HR, 0.08 * HR, -0.18 * HR, 0.04 * HR, -0.16 * HR, -0.02 * HR);
      ctx.closePath(); ctx.fill();
      if (outline) {
        ctx.strokeStyle = LOOK.material.outline.color;
        ctx.lineWidth = Math.max(1, LOOK.material.outline.thickness * PPU * (LOOK.canvasHints.inkWidth || 1));
        ctx.stroke();
      }
      ctx.fillStyle = P.protagInk;   // black muzzle (shepherd), not the fox's cream underside
      ctx.beginPath(); ctx.moveTo(0.06 * HR, 0.07 * HR); ctx.quadraticCurveTo(0.24 * HR, 0.08 * HR, 0.4 * HR, 0.015 * HR);
      ctx.quadraticCurveTo(0.24 * HR, 0.12 * HR, 0.06 * HR, 0.11 * HR); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P.protagInk;
      ctx.beginPath(); ctx.ellipse(0.42 * HR, 0.02 * HR, 0.035 * HR, 0.028 * HR, 0, 0, TAU); ctx.fill();
      if (pr.blink > 0) { ctx.fillRect(0.1 * HR, -0.05 * HR, 0.08 * HR, 0.025 * HR); }
      else { ctx.beginPath(); ctx.arc(0.14 * HR, -0.04 * HR, 0.035 * HR, 0, TAU); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0.15 * HR, -0.05 * HR, 0.012 * HR, 0, TAU); ctx.fill(); }
      ctx.restore();
    }

    function drawPetalsFlies(fr) {
      for (const q of fr.particles.petals) {
        // petal q.y is an ABSOLUTE world height (matches the 3D adapter) —
        // groundLineY here would double-count the terrain
        const sx = SX(q.x), sy = groundY - q.y * PPU;
        if (sx < -20 || sx > W + 20) continue;
        ctx.save(); ctx.globalAlpha = clamp(q.life * 2, 0, 0.95); ctx.translate(sx, sy); ctx.rotate(q.rot);
        ctx.fillStyle = P.blossom[1]; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (const fdef of fr.particles.flies) {
        const sx = SX(fdef.x), sy = groundLineY(fdef.x) - (fdef.y + (runtime.reduce ? 0 : Math.sin(fr.t + fdef.ph) * 0.2)) * PPU;
        if (sx < -20 || sx > W + 20) continue;
        const pulse = runtime.reduce ? 0.7 : 0.4 + 0.6 * Math.abs(Math.sin(fr.t * 2.2 + fdef.ph));
        ctx.globalAlpha = pulse * 0.9; ctx.fillStyle = P.firefly;
        ctx.shadowColor = P.firefly; ctx.shadowBlur = 9 * (0.5 + bloomMul * 0.5);
        ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    function drawForeground(fr) {
      // near grass rendered ONCE to an offscreen, blurred in one composite —
      // gated on the look's dof entry (no dof → drawn sharp), radius scaled
      // by canvasHints.blurScale (§2.5)
      if (!fgOff) return;
      fgCtx.setTransform(1, 0, 0, 1, 0, 0);
      fgCtx.clearRect(0, 0, fgOff.width, fgOff.height);
      fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);   // tufts draw in CSS coords at device resolution
      fgCtx.fillStyle = P.fgGrass;
      for (const tf of fr.tufts) {
        const nsx = W * 0.5 + (SX(tf.x) - W * 0.5) * 1.25;
        if (nsx < -30 || nsx > W + 30) continue;
        const gy = groundLineY(tf.x) + 4, hh = tf.h * PPU * 0.9;
        const sway = runtime.reduce ? 0 : Math.sin(fr.t * 1.5 + tf.z) * 3;
        fgCtx.beginPath(); fgCtx.moveTo(nsx - 4, gy);
        fgCtx.quadraticCurveTo(nsx + Math.sin(tf.lean) * hh * 0.4 + sway, gy - hh * 0.6, nsx + Math.sin(tf.lean) * hh + sway, gy - hh);
        fgCtx.quadraticCurveTo(nsx + Math.sin(tf.lean) * hh * 0.45 + sway, gy - hh * 0.55, nsx + 4, gy); fgCtx.fill();
      }
      ctx.save();
      if (dofEntry) ctx.filter = `blur(${(2.5 * (dofEntry.bokeh || 3.5) / 3.5 * (LOOK.canvasHints.blurScale || 1)).toFixed(1)}px)`;
      ctx.drawImage(fgOff, 0, 0, W, H);
      ctx.restore();
    }
    function drawVignette(fr) {
      const v = vigEntry || { darkness: 0.4 };
      // vignette tint is a WORLD role (falls back to the night literal so
      // night-path is unchanged) — a baked cold blue crushed the desert's
      // golden corners cold (review-confirmed)
      const vc = P.vignette || "6,4,12";
      const g = ctx.createRadialGradient(W * 0.5, H * 0.42, H * 0.3, W * 0.5, H * 0.5, H * 0.85);
      g.addColorStop(0, `rgba(${vc},0)`); g.addColorStop(1, `rgba(${vc},${v.darkness})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (grainEntry && grain) {
        ctx.save(); ctx.globalAlpha = grainEntry.amount; ctx.globalCompositeOperation = "overlay";
        const jx = runtime.reduce || !grainEntry.animated ? 0 : (fr.t * 40 % 128);
        for (let x = -128; x < W + 128; x += 128) for (let y = -128; y < H; y += 128) ctx.drawImage(grain, x - jx, y);
        ctx.restore();
      }
    }

    let frameRef = null;
    function render(frame) {
      frameRef = frame;
      const dt = lastT == null ? 1 / 60 : clamp(frame.t - lastT, 1 / 240, 0.05);
      lastT = frame.t;
      // FRAMING from the SHARED dolly rail (frame.camera) — same smoothed
      // look-ahead/velocity-lead the 3D camera uses, so both adapters frame
      // the fox identically; fovMul zooms, sway breathes (ambient-gated)
      const railX = frame.camera.pos[0];
      const sway = runtime.reduce ? 0 : Math.sin(frame.t * LOOK.camera.swayFreq * TAU * 0.15) * LOOK.camera.swayAmp * 0.12;
      const viewW = W / PPU;
      camLeft = railX - viewW * 0.5 + sway;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawSky(frame);
      drawAurora(frame);   // upper-sky curtains, behind the ridges (occluded by peaks)
      for (const layer of world.layers) if (layer.kind === "ridge" || layer.kind === "hills") distanceLayer(layer);
      drawGround();
      // depth order matches the 3D camera (+z is nearer): back-to-front,
      // with the fox (z=0) interleaved so near-side props can pass in front
      const props = frame.props.slice().sort((a, b) => (a.z || 0) - (b.z || 0) || a.x - b.x);
      const visible = (p) => SX(p.x) > -260 && SX(p.x) < W + 260;
      for (const p of props) { if ((p.z || 0) <= 0 && visible(p)) { const f = PROP[p.type]; if (f) f(p); } }
      drawPetalsFlies(frame);
      drawFox(frame, dt);
      for (const p of props) { if ((p.z || 0) > 0 && visible(p)) { const f = PROP[p.type]; if (f) f(p); } }
      drawForeground(frame);
      drawVignette(frame);
    }
    function resize(w, h, ratio) {
      W = w; H = h; dpr = Math.min(ratio, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      if (!fgOff) fgOff = document.createElement("canvas");
      // device-pixel sized like the main canvas — a CSS-px offscreen gets
      // upscaled on HiDPI and the near grass reads soft even without DOF
      fgOff.width = Math.round(w * dpr); fgOff.height = Math.round(h * dpr);
      fgCtx = fgOff.getContext("2d");
      PPU = H * 0.2 / (LOOK.camera.fovMul || 1);
      groundY = H * 0.7;
    }
    function setLook(nl) {
      LOOK = nl; digestLook();
      PPU = H > 0 ? H * 0.2 / (LOOK.camera.fovMul || 1) : PPU;
      if (window.WorldGrade) window.WorldGrade.apply(canvas, LOOK, { tone: true });
    }
    buildGrain();
    digestLook();
    if (window.WorldGrade) window.WorldGrade.apply(canvas, LOOK, { tone: true });

    return {
      render, resize, setLook,
      dispose() { if (window.WorldGrade) window.WorldGrade.clear(canvas); },
      capabilities: { shadows: false, volumetric: false, dof: true, pointLights: 0 },
      _debug: { propTypes: Object.keys(PROP) },
    };
  }

  function mulberry(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  window.CanvasWorldAdapter = CanvasWorldAdapter;
})();

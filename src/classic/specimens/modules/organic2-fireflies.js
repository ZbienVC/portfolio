(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'bioluminescence',
  name: 'Bioluminescence',
  family: 'Organic',
  tags: ['canvas', 'particles', 'bloom', 'night', 'parallax'],
  blurb: 'A forest at midnight where hundreds of fireflies drift between the trees, blinking on and off. Bring your cursor close and they wake up, glow brighter and swirl around it like a small galaxy.',
  how: 'Each firefly follows a smooth wandering path with its own blink rhythm. The glow is drawn on a small offscreen canvas, blurred and added back on top (a bloom), and layered tree silhouettes with fog create depth.',
  useFor: 'night mode heroes, meditation and sleep apps, fantasy games, nature brands',
  interact: 'Move to gather and brighten fireflies, click to scatter them',
  init(host, api) {
    const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#020806';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    const glow = document.createElement('canvas');
    const gctx = glow.getContext('2d');
    const bg = document.createElement('canvas');
    let W = 1, H = 1, flies = [], layers = [], spr = null, sprBig = null;
    let px = 0.5, py = 0.5, scatter = 0;
    const R = Math.random;

    function makeSprite(size, core) {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const g = c.getContext('2d'); const r = size / 2;
      const gr = g.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(core, 'rgba(200,255,140,0.85)');
      gr.addColorStop(core * 2.5, 'rgba(120,230,90,0.25)'); gr.addColorStop(1, 'rgba(60,180,80,0)');
      g.fillStyle = gr; g.fillRect(0, 0, size, size); return c;
    }

    function treeLayer(depth) {
      const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      const g = c.getContext('2d'); g.scale(DPR, DPR);
      const l = 4 + depth * 9;
      g.fillStyle = `rgb(${2 + l * 0.3},${8 + l},${10 + l * 0.9})`;
      const n = Math.ceil(W / (40 + depth * 40)) + 4;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * W * 1.15 - W * 0.05 + (R() - 0.5) * 40;
        const tw = (6 + R() * 10) * (1.6 - depth * 0.5) * (W / 900 + 0.5);
        g.fillRect(x - tw / 2, 0, tw, H);
        // branches
        g.strokeStyle = g.fillStyle; g.lineCap = 'round';
        for (let b = 0; b < 5; b++) {
          const by = R() * H * 0.7; const dir = R() < 0.5 ? -1 : 1;
          g.lineWidth = tw * 0.35; g.beginPath(); g.moveTo(x, by);
          g.quadraticCurveTo(x + dir * 30, by - 20, x + dir * (40 + R() * 60), by - 40 - R() * 30); g.stroke();
        }
      }
      // ground ferns
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, H - (20 + depth * 30) - Math.sin(x * 0.03 + depth) * 10 - R() * 12);
      g.lineTo(W, H); g.fill();
      return c;
    }

    function setup() {
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      glow.width = Math.max(1, Math.round(W / 4)); glow.height = Math.max(1, Math.round(H / 4));
      bg.width = cv.width; bg.height = cv.height;
      const g = bg.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, bg.height);
      sky.addColorStop(0, '#010405'); sky.addColorStop(0.55, '#06201f'); sky.addColorStop(1, '#0a2a22');
      g.fillStyle = sky; g.fillRect(0, 0, bg.width, bg.height);
      const moon = g.createRadialGradient(bg.width * 0.72, bg.height * 0.2, 0, bg.width * 0.72, bg.height * 0.2, bg.height * 0.7);
      moon.addColorStop(0, 'rgba(120,200,190,0.28)'); moon.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = moon; g.fillRect(0, 0, bg.width, bg.height);
      layers = [treeLayer(2), treeLayer(1), treeLayer(0)];
      spr = makeSprite(64, 0.08); sprBig = makeSprite(64, 0.18);
      const n = Math.min(260, Math.max(70, Math.floor(W * H / 4200)));
      flies = [];
      for (let i = 0; i < n; i++) {
        const z = R();
        flies.push({ x: R() * W, y: H * 0.15 + R() * H * 0.85, vx: 0, vy: 0, z, ph: R() * 100, sp: 0.4 + R() * 0.8, blink: 0.5 + R() * 1.6, hue: R() });
      }
    }

    function resize(w, h) { W = Math.max(1, w); H = Math.max(1, h); setup(); }
    api.onClick(e => { scatter = 1; flies.forEach(f => { const dx = f.x - e.x, dy = f.y - e.y, d = Math.hypot(dx, dy) + 1; f.vx += dx / d * 260; f.vy += dy / d * 260; }); });
    resize(host.clientWidth, host.clientHeight);

    return {
      frame(t, dt) {
        try {
          dt = Math.min(dt, 0.05);
          const tt = api.reduced ? t * 0.3 : t;
          const p = api.pointer;
          px += ((p.inside ? p.nx : 0.5) - px) * dt * 2; py += ((p.inside ? p.ny : 0.5) - py) * dt * 2;
          scatter *= Math.pow(0.2, dt);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(bg, 0, 0);
          // parallax layers with fog between them
          const offs = [8, 20, 40];
          gctx.setTransform(1, 0, 0, 1, 0, 0);
          gctx.globalCompositeOperation = 'source-over';
          gctx.fillStyle = 'rgba(0,0,0,1)'; gctx.fillRect(0, 0, glow.width, glow.height);
          gctx.globalCompositeOperation = 'lighter';
          const gs = glow.width / W;
          const drawFlies = (zmin, zmax) => {
            ctx.globalCompositeOperation = 'lighter';
            for (const f of flies) {
              if (f.z < zmin || f.z >= zmax) continue;
              const dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy);
              const near = p.inside ? Math.max(0, 1 - d / (Math.min(W, H) * 0.45)) : 0;
              // wander
              const a = Math.sin(tt * 0.3 * f.sp + f.ph) * 3 + Math.cos(tt * 0.17 + f.ph * 1.3) * 2;
              f.vx += Math.cos(a) * 18 * dt; f.vy += Math.sin(a) * 14 * dt - 2 * dt;
              if (near > 0) {
                // swirl: tangential plus gentle pull
                const tx = -dy / (d + 1), ty = dx / (d + 1);
                f.vx += (tx * 120 + dx / (d + 1) * 40) * near * dt * 3;
                f.vy += (ty * 120 + dy / (d + 1) * 40) * near * dt * 3;
              }
              f.vx *= 0.97; f.vy *= 0.97;
              f.x += f.vx * dt; f.y += f.vy * dt;
              if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20;
              if (f.y < H * 0.05) f.vy += 20 * dt; if (f.y > H + 10) f.y = H * 0.4;
              const bl = Math.pow(Math.max(0, Math.sin(tt * f.blink + f.ph)), 3);
              const bright = Math.min(1, 0.15 + bl * 0.85 + near * 0.9 + scatter * 0.5);
              const size = (2 + f.z * 6) * (0.5 + bright * 0.7) * (1 + near * 0.5);
              const ox = (px - 0.5) * -offs[2] * f.z, oy = (py - 0.5) * -offs[2] * f.z * 0.5;
              const sx = f.x + ox, sy = f.y + oy;
              ctx.globalAlpha = bright * (0.5 + f.z * 0.5);
              ctx.drawImage(f.hue > 0.85 ? sprBig : spr, (sx - size) * DPR, (sy - size) * DPR, size * 2 * DPR, size * 2 * DPR);
              gctx.globalAlpha = bright * 0.7;
              const gsz = size * 2.2 * gs;
              gctx.drawImage(sprBig, sx * gs - gsz, sy * gs - gsz, gsz * 2, gsz * 2);
            }
            ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
          };
          for (let i = 0; i < 3; i++) {
            const o = offs[i];
            ctx.drawImage(layers[i], (px - 0.5) * -o * DPR - o * DPR * 0.5, (py - 0.5) * -o * 0.3 * DPR, cv.width + o * DPR, cv.height);
            // fog band
            const fg = ctx.createLinearGradient(0, cv.height * 0.5, 0, cv.height);
            fg.addColorStop(0, 'rgba(40,110,100,0)'); fg.addColorStop(1, `rgba(40,110,100,${0.12 + i * 0.03})`);
            ctx.fillStyle = fg; ctx.fillRect(0, 0, cv.width, cv.height);
            drawFlies(i / 3, (i + 1) / 3);
          }
          // bloom
          ctx.globalCompositeOperation = 'lighter';
          ctx.imageSmoothingEnabled = true;
          try { ctx.filter = 'blur(' + (6 * DPR) + 'px)'; } catch (e) {}
          ctx.globalAlpha = 0.75;
          ctx.drawImage(glow, 0, 0, cv.width, cv.height);
          ctx.filter = 'none'; ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
          const vg = ctx.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.3, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.75);
          vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,5,5,0.65)');
          ctx.fillStyle = vg; ctx.fillRect(0, 0, cv.width, cv.height);
        } catch (e) {}
      },
      resize(w, h) { resize(w, h); },
      destroy() { cv.remove(); flies = []; layers = []; }
    };
  }
});

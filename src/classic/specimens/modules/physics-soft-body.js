(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'soft-body-jelly',
  name: 'Soft Body Jelly',
  family: 'Physics',
  tags: ['soft body', 'pressure', 'canvas', 'simulation'],
  blurb: 'Glossy jelly blobs drop, wobble and squish into each other like gummy candy. Each one keeps its shape by pushing outward, so they bounce back after every squash.',
  how: 'Each blob is a pressure soft body, a ring of points joined by springs with an inner push that tries to keep the area the same, which makes it act like a balloon full of jelly.',
  useFor: 'playful brand moments, kids or candy products, loading screens',
  interact: 'Grab and fling a blob, click empty space to poke the jelly',
  init(host, api) {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 1, H = 1, dpr = 1;
    const N = 22;
    const COLS = [['#ff6b9a', '#b8174f'], ['#7ef0c8', '#119a7a'], ['#ffd25e', '#d17d0c'], ['#8fb6ff', '#3354d6'], ['#d29bff', '#7a32c9'], ['#ff9b6b', '#cc3d1a']];
    let blobs = [];
    let grab = null;

    function makeBlob(x, y, r, ci) {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        pts.push({ x: px, y: py, ox: px, oy: py });
      }
      const target = Math.PI * r * r;
      return { pts, r, seg: 2 * Math.PI * r / N, area: target, col: COLS[ci % COLS.length], cx: x, cy: y, wob: Math.random() * 6 };
    }
    function populate() {
      blobs = [];
      const n = Math.max(4, Math.min(9, Math.round(W / 150)));
      const base = Math.min(W / (n * 2.4), H * 0.2);
      for (let i = 0; i < n; i++) {
        const r = base * (0.75 + Math.random() * 0.5);
        blobs.push(makeBlob(W * (i + 0.5) / n + (Math.random() - 0.5) * 20, H * 0.3 - Math.random() * H * 0.3, r, i));
      }
    }
    function resize(w, h) {
      const first = W === 1;
      W = Math.max(1, w); H = Math.max(1, h);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      if (first || !blobs.length) populate();
    }
    function area(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; } return a / 2; }
    const floorY = () => H - Math.max(14, H * 0.08);

    function step(dt, t) {
      const g = H * 2.2;
      const fy = floorY();
      for (const b of blobs) {
        for (const p of b.pts) {
          const vx = (p.x - p.ox) * 0.995, vy = (p.y - p.oy) * 0.995;
          p.ox = p.x; p.oy = p.y;
          p.x += vx; p.y += vy + g * dt * dt;
        }
      }
      if (grab) {
        const P = api.pointer;
        const b = grab.b;
        let cx = 0, cy = 0; for (const p of b.pts) { cx += p.x; cy += p.y; } cx /= N; cy /= N;
        const dx = P.x - cx - grab.ox, dy = P.y - cy - grab.oy;
        for (const p of b.pts) { p.x += dx * 0.08; p.y += dy * 0.08; }
      }
      for (let it = 0; it < 6; it++) {
        for (const b of blobs) {
          const pts = b.pts;
          // springs between neighbors and across 2
          for (let i = 0; i < N; i++) {
            for (const k of [1, 2]) {
              const p = pts[i], q = pts[(i + k) % N];
              const rest = k === 1 ? b.seg : 2 * b.r * Math.sin(2 * Math.PI / N);
              const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
              const f = (d - rest) / d * (k === 1 ? 0.5 : 0.25);
              p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f;
            }
          }
          // pressure: push along outward normal to restore area
          const A = area(pts);
          const wob = 1 + Math.sin(t * 2 + b.wob) * 0.03;
          const diff = (b.area * wob - A) / (b.seg * N) * 0.5;
          for (let i = 0; i < N; i++) {
            const p0 = pts[(i + N - 1) % N], p1 = pts[(i + 1) % N], p = pts[i];
            let nx = p1.y - p0.y, ny = -(p1.x - p0.x);
            const nl = Math.hypot(nx, ny) || 1;
            p.x += nx / nl * diff; p.y += ny / nl * diff;
          }
          // walls
          for (const p of pts) {
            if (p.y > fy) { p.y = fy; p.ox += (p.x - p.ox) * 0.4; }
            if (p.x < 4) { p.x = 4; } if (p.x > W - 4) { p.x = W - 4; }
          }
        }
        // blob vs blob: push points out of other blob's circle approximation
        for (let i = 0; i < blobs.length; i++) {
          const a = blobs[i];
          let ax = 0, ay = 0; for (const p of a.pts) { ax += p.x; ay += p.y; } ax /= N; ay /= N; a.cx = ax; a.cy = ay;
        }
        for (let i = 0; i < blobs.length; i++) for (let j = 0; j < blobs.length; j++) {
          if (i === j) continue;
          const a = blobs[i], b = blobs[j];
          const dcx = a.cx - b.cx, dcy = a.cy - b.cy;
          if (Math.hypot(dcx, dcy) > (a.r + b.r) * 1.4) continue;
          for (const p of a.pts) {
            const dx = p.x - b.cx, dy = p.y - b.cy, d = Math.hypot(dx, dy) || 1;
            const lim = b.r * 0.92;
            if (d < lim) { const push = (lim - d) * 0.5; p.x += dx / d * push; p.y += dy / d * push; }
          }
        }
      }
      // reset fallen or stuck far blobs occasionally
      for (const b of blobs) {
        if (b.cy < -H * 2 || b.cy > H * 3 || !isFinite(b.cy)) {
          const nb = makeBlob(Math.random() * W, -b.r * 2, b.r, (Math.random() * 6) | 0);
          b.pts = nb.pts;
        }
      }
    }
    resize(host.clientWidth, host.clientHeight);
    for (let i = 0; i < 90; i++) step(1 / 60, i / 60);

    api.onClick && api.onClick(p => {
      for (const b of blobs) {
        for (const q of b.pts) {
          const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
          if (d < b.r * 3) { const f = (1 - d / (b.r * 3)) * b.r * 0.35; q.ox -= dx / d * f; q.oy -= dy / d * f + f * 0.6; }
        }
      }
    });

    function blobPath(pts) {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const p = pts[i], q = pts[(i + 1) % N];
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        if (i === 0) { const z = pts[N - 1]; ctx.moveTo((z.x + p.x) / 2, (z.y + p.y) / 2); }
        ctx.quadraticCurveTo(p.x, p.y, mx, my);
      }
      ctx.closePath();
    }

    let downPrev = false;
    return {
      frame(t, dt) {
        try {
          dt = Math.min(dt || 0.016, 0.033);
          const P = api.pointer || {};
          if (P.down && !downPrev && P.inside) {
            for (const b of blobs) {
              if (Math.hypot(P.x - b.cx, P.y - b.cy) < b.r * 1.1) { grab = { b, ox: P.x - b.cx, oy: P.y - b.cy }; grab.ox = 0; grab.oy = 0; break; }
            }
          }
          if (!P.down) grab = null;
          downPrev = !!P.down;
          const sub = 2;
          for (let k = 0; k < sub; k++) step(dt / sub, t);
          // periodic re-drop of one blob to keep it lively
          if (!api.reduced && Math.floor(t / 3.5) !== Math.floor((t - dt) / 3.5)) {
            const b = blobs[(Math.random() * blobs.length) | 0];
            if (b !== (grab && grab.b)) for (const q of b.pts) { q.oy = q.y + H * 0.035; }
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          // backdrop
          const bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, '#fff1e6'); bg.addColorStop(0.55, '#ffd9cf'); bg.addColorStop(1, '#f4b8c5');
          ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
          const sp = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, Math.max(W, H) * 0.7);
          sp.addColorStop(0, 'rgba(255,255,255,0.8)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
          const fy = floorY();
          // floor
          const fg = ctx.createLinearGradient(0, fy, 0, H);
          fg.addColorStop(0, '#f09fb2'); fg.addColorStop(1, '#d7738f');
          ctx.fillStyle = fg; ctx.fillRect(0, fy, W, H - fy);
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, fy, W, 1.5);
          // shadows and caustic glow on floor
          for (const b of blobs) {
            const h = Math.max(0, fy - (b.cy + b.r));
            const k = Math.max(0.15, 1 - h / (H * 0.6));
            ctx.save();
            ctx.globalAlpha = 0.35 * k;
            const sg = ctx.createRadialGradient(b.cx, fy, 0, b.cx, fy, b.r * 1.3);
            sg.addColorStop(0, 'rgba(90,20,50,0.9)'); sg.addColorStop(1, 'rgba(90,20,50,0)');
            ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(b.cx, fy + 2, b.r * 1.3, b.r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 0.45 * k;
            const cg = ctx.createRadialGradient(b.cx + b.r * 0.2, fy + 3, 0, b.cx + b.r * 0.2, fy + 3, b.r * 0.9);
            cg.addColorStop(0, b.col[0]); cg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(b.cx + b.r * 0.2, fy + 3, b.r * 0.9, b.r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
          for (const b of blobs) {
            const [hi, lo] = b.col, r = b.r;
            let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
            for (const p of b.pts) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); }
            const sx = (maxX - minX) / (2 * r), sy = (maxY - minY) / (2 * r);
            // body
            blobPath(b.pts);
            const g = ctx.createRadialGradient(b.cx - r * 0.3, b.cy - r * 0.35, r * 0.1, b.cx, b.cy, r * 1.15);
            g.addColorStop(0, hi); g.addColorStop(0.65, hi); g.addColorStop(1, lo);
            ctx.save();
            ctx.shadowColor = 'rgba(120,30,60,0.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
            ctx.globalAlpha = 0.92;
            ctx.fillStyle = g; ctx.fill();
            ctx.restore();
            ctx.save();
            blobPath(b.pts); ctx.clip();
            // inner rim darkening
            ctx.lineWidth = r * 0.35; ctx.strokeStyle = lo; ctx.globalAlpha = 0.45; ctx.filter = 'blur(' + Math.max(2, r * 0.12) + 'px)';
            blobPath(b.pts); ctx.stroke();
            ctx.filter = 'none'; ctx.globalAlpha = 1;
            // bottom internal glow (subsurface)
            const ig = ctx.createRadialGradient(b.cx + r * 0.2, maxY, 0, b.cx + r * 0.2, maxY, r * 0.9);
            ig.addColorStop(0, 'rgba(255,255,255,0.55)'); ig.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = ig; ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
            // bubbles
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            for (let i = 0; i < 4; i++) {
              const a = b.wob * 3 + i * 1.7, rr = r * (0.25 + 0.12 * i);
              ctx.beginPath(); ctx.arc(b.cx + Math.cos(a) * rr * sx, b.cy + Math.sin(a) * rr * sy, r * (0.03 + 0.015 * (i % 2)), 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
            // glossy highlight that squashes with the body
            ctx.save();
            ctx.translate(b.cx - r * 0.32 * sx, b.cy - r * 0.42 * sy);
            ctx.rotate(-0.5);
            const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.4);
            hg.addColorStop(0, 'rgba(255,255,255,0.95)'); hg.addColorStop(0.5, 'rgba(255,255,255,0.4)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.38 * sx, r * 0.2 * sy, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath(); ctx.ellipse(r * 0.05, -r * 0.02, r * 0.12 * sx, r * 0.05 * sy, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            // rim light
            ctx.save();
            blobPath(b.pts);
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.stroke();
            ctx.restore();
          }
        } catch (e) { }
      },
      resize(w, h) { resize(w, h); },
      destroy() { cv.remove(); }
    };
  }
});

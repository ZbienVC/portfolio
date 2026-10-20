(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'geo2-string-art',
  name: 'String Art Weave',
  family: 'Geometry',
  tags: ['canvas2d', 'times tables', 'cardioid', 'additive'],
  blurb: 'Hundreds of glowing threads stretched between pins on a ring. Only straight lines are drawn, yet hearts, flowers and nested loops bloom out of them as the rule slowly changes.',
  how: 'A times table on a circle: pin number n is joined to pin n times k, and as the multiplier k slides from 2 to 3 and beyond, the straight threads trace curved envelopes like the cardioid and nephroid.',
  useFor: 'Music visualizers, math and education heroes, calm ambient backdrops',
  interact: 'Move left and right to scrub the multiplier, click to change the thread colors',
  init(host, api) {
    const cvs = document.createElement('canvas');
    cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(cvs);
    const ctx = cvs.getContext('2d');
    let W = 1, H = 1, dpr = 1;
    const schemes = [
      [[255, 90, 160], [255, 180, 80], [80, 200, 255]],
      [[120, 255, 210], [90, 140, 255], [200, 110, 255]],
      [[255, 210, 140], [255, 120, 70], [255, 240, 220]]
    ];
    let si = 0;
    api.onClick(() => { si = (si + 1) % schemes.length; });
    function resize(w, h) {
      W = Math.max(1, w); H = Math.max(1, h);
      dpr = Math.min(devicePixelRatio || 1, 1.75);
      cvs.width = W * dpr; cvs.height = H * dpr;
    }
    resize(host.clientWidth, host.clientHeight);
    let kS = 2, manual = 0;
    const BUCKETS = 10;
    function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function grad(sc, u) {
      u = ((u % 1) + 1) % 1;
      const s = u * 3, i = Math.floor(s), f = s - i;
      return lerp3(sc[i % 3], sc[(i + 1) % 3], f);
    }
    function weave(cx, cy, rad, N, k, rot, sc, alpha, lw, colOff) {
      const px = new Float32Array(N), py = new Float32Array(N);
      for (let i = 0; i < N; i++) { const a = rot + i / N * Math.PI * 2; px[i] = cx + Math.cos(a) * rad; py[i] = cy + Math.sin(a) * rad; }
      ctx.lineWidth = lw;
      for (let b = 0; b < BUCKETS; b++) {
        const c = grad(sc, b / BUCKETS + colOff);
        ctx.strokeStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
        ctx.beginPath();
        for (let i = b; i < N; i += BUCKETS) {
          const jf = (i * k) % N;
          const a2 = rot + jf / N * Math.PI * 2;
          ctx.moveTo(px[i], py[i]);
          ctx.lineTo(cx + Math.cos(a2) * rad, cy + Math.sin(a2) * rad);
        }
        ctx.stroke();
      }
      return [px, py];
    }
    return {
      frame(t, dt) {
        try {
          const tt = t * (api.reduced ? 0.2 : 1);
          let target;
          if (api.pointer.inside) { manual = 1; target = 2 + api.pointer.nx * 9; }
          else { const base = 2 + ((tt * 0.05) % 7); target = Math.floor(base) + Math.pow((base % 1), 3); }
          kS += (target - kS) * (api.pointer.inside ? 0.08 : 0.5);
          const k = kS;
          const sc = schemes[si];
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) * 0.6);
          bg.addColorStop(0, '#120c22'); bg.addColorStop(1, '#030207');
          ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
          const M = Math.min(W, H);
          const cx = W / 2, cy = H / 2, rad = M * 0.43;
          const N = W * H > 300000 ? 400 : 300;
          const rot = -Math.PI / 2 + tt * 0.03;
          ctx.globalCompositeOperation = 'lighter';
          // halo
          const hg = ctx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad * 1.25);
          const c0 = sc[0];
          hg.addColorStop(0, `rgba(${c0[0]},${c0[1]},${c0[2]},0.06)`); hg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
          // ghost layer slightly behind multiplier for motion blur depth
          weave(cx, cy, rad, N >> 1, k - 0.06, rot, sc, 0.06, 1.8, tt * 0.03 + 0.3);
          // main weave
          const pins = weave(cx, cy, rad, N, k, rot, sc, M > 500 ? 0.3 : 0.34, 0.8, tt * 0.03);
          // inner echo: a smaller counter-rotating weave
          weave(cx, cy, rad * 0.32, 90, k * 2 + 1, -rot * 2, sc, 0.14, 0.6, tt * 0.05 + 0.5);
          // pins
          ctx.fillStyle = 'rgba(255,240,220,0.75)';
          const ps = Math.max(0.8, M / 600);
          for (let i = 0; i < N; i += 2) ctx.fillRect(pins[0][i] - ps / 2, pins[1][i] - ps / 2, ps, ps);
          ctx.globalCompositeOperation = 'source-over';
          // rim
          ctx.strokeStyle = 'rgba(255,230,200,0.25)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, rad + 5, 0, 7); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,230,200,0.1)';
          ctx.beginPath(); ctx.arc(cx, cy, rad + 10, 0, 7); ctx.stroke();
          // ticks around rim
          for (let i = 0; i < 72; i++) {
            const a = rot + i / 72 * Math.PI * 2, l = i % 6 === 0 ? 8 : 3;
            ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (rad + 10), cy + Math.sin(a) * (rad + 10));
            ctx.lineTo(cx + Math.cos(a) * (rad + 10 + l), cy + Math.sin(a) * (rad + 10 + l)); ctx.stroke();
          }
          // label
          const fs = Math.max(10, M * 0.028);
          ctx.font = `${fs}px "JetBrains Mono", monospace`;
          ctx.fillStyle = 'rgba(255,235,215,0.7)';
          ctx.fillText(`n -> n x ${k.toFixed(3)}`, 16, H - 16);
          ctx.textAlign = 'right';
          ctx.fillText(`${N} pins`, W - 16, H - 16);
          ctx.textAlign = 'left';
          const v = ctx.createRadialGradient(cx, cy, M * 0.4, cx, cy, Math.hypot(W, H) * 0.6);
          v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
          ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
        } catch (e) {}
      },
      resize(w, h) { resize(w, h); },
      destroy() { cvs.remove(); }
    };
  }
});

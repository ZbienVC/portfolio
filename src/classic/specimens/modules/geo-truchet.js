(function () {
  (window.SPECIMENS = window.SPECIMENS || []).push({
    id: 'truchet-tiles',
    name: 'Truchet Tiles',
    family: 'Geometry',
    tags: ['canvas2d', 'tiling', 'maze', 'pattern'],
    blurb: 'A mosaic of simple square tiles, each holding two quarter circles, that flip over in rolling waves and keep stitching themselves into new winding mazes.',
    how: 'Every tile has only two possible turns, but because the curves always meet at the middle of each edge, any random mix joins up into unbroken paths, a trick known as Truchet tiling.',
    useFor: 'brand patterns, packaging, section dividers, loading screens',
    interact: 'Move to send a flip wave, click to drop a ripple',
    init(host, api) {
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      host.appendChild(cv);
      const ctx = cv.getContext('2d');
      let sprites = null, W = 1, H = 1, dpr = 1, S = 48, cols = 0, rows = 0, tiles = [];
      const ripples = [];
      try { api.onClick(e => { ripples.push({ x: e.x, y: e.y, t: 0 }); if (ripples.length > 5) ripples.shift(); }); } catch (e) {}
      let lastPX = -1, lastPY = -1, trail = 0;

      function resize(w, h) {
        W = Math.max(1, w); H = Math.max(1, h);
        dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        S = Math.max(26, Math.min(64, Math.round(Math.min(W, H) / 7.5)));
        sprites = null;
        cols = Math.ceil(W / S) + 1; rows = Math.ceil(H / S) + 1;
        const old = tiles; tiles = [];
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          const o = old[j * cols + i];
          const s = Math.random() < 0.5 ? 0 : 1;
          tiles.push(o || { s: s, a: s, cool: 0, hue: 0 });
        }
      }
      resize(host.clientWidth, host.clientHeight);

      const BG = '#0f1a2e', A = '#f4ead6', B = '#e8604c', A2 = '#14244a', B2 = '#d9553f';
      function mix(c1, c2, k) { const a = [1, 3, 5].map(i => parseInt(c1.substr(i, 2), 16)), b = [1, 3, 5].map(i => parseInt(c2.substr(i, 2), 16)); return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',') + ')'; }
      function tileArcs(x, y, s, rot) {
        // two quarter-circle arcs in a tile, rotated by rot (0 or 90 deg animated)
        ctx.save();
        ctx.translate(x + s / 2, y + s / 2);
        ctx.rotate(rot * Math.PI / 2);
        ctx.beginPath();
        ctx.arc(-s / 2, -s / 2, s / 2, 0, Math.PI / 2);
        ctx.moveTo(s / 2, s / 2 - s / 2 + s / 2);
        ctx.arc(s / 2, s / 2, s / 2, Math.PI, Math.PI * 1.5);
        ctx.restore();
      }

      function buildSprites() {
        sprites = [];
        const SP = Math.round(S * dpr);
        for (let k = 0; k < 3; k++) {
          const c = document.createElement('canvas'); c.width = SP; c.height = SP;
          const g = c.getContext('2d');
          g.scale(SP / S, SP / S); g.translate(S / 2, S / 2);
          const arcs = (r) => { g.beginPath(); g.arc(-S / 2, -S / 2, r, 0, Math.PI / 2); g.stroke(); g.beginPath(); g.arc(S / 2, S / 2, r, Math.PI, Math.PI * 1.5); g.stroke(); };
          const lw = S * 0.3;
          if (k < 2) {
            const c1 = k ? A2 : B2, c2 = k ? B2 : A2;
            g.fillStyle = c1; g.fillRect(-S / 2, -S / 2, S, S);
            g.fillStyle = c2;
            g.beginPath(); g.moveTo(-S / 2, -S / 2); g.arc(-S / 2, -S / 2, S / 2, 0, Math.PI / 2); g.closePath(); g.fill();
            g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S / 2, Math.PI, Math.PI * 1.5); g.closePath(); g.fill();
            g.lineWidth = S * 0.16; g.strokeStyle = 'rgba(0,0,0,0.18)'; arcs(S / 2 - S * 0.08);
            g.strokeStyle = 'rgba(255,255,255,0.10)'; arcs(S / 2 + S * 0.08);
            g.lineWidth = lw * 0.42;
            g.save(); g.translate(S * 0.03, S * 0.05); g.strokeStyle = 'rgba(0,0,0,0.45)'; arcs(S / 2); g.restore();
            g.strokeStyle = A; arcs(S / 2);
            g.lineWidth = lw * 0.1; g.strokeStyle = 'rgba(255,255,255,0.7)'; arcs(S / 2 - lw * 0.08);
          } else {
            g.lineWidth = lw * 0.42; g.strokeStyle = '#ffc56a'; arcs(S / 2);
          }
          sprites.push(c);
        }
        sprites.S = S;
      }

      return {
        frame(t, dt) {
          try {
            dt = Math.min(dt || 0.016, 0.1);
            const p = api.pointer || {};
            // waves: a slow diagonal sweep flips tiles
            const sweep = (t * (api.reduced ? 0.1 : 0.45)) % 2;
            for (const r of ripples) r.t += dt;
            while (ripples.length && ripples[0].t > 3) ripples.shift();
            for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
              const T = tiles[j * cols + i];
              T.cool -= dt;
              const cx = (i + 0.5) * S, cy = (j + 0.5) * S;
              let trig = false;
              // diagonal sweep band
              const dpos = (i / cols + j / rows) * 0.5;
              const band = Math.abs(((sweep - dpos * 1.6) % 2 + 2) % 2 - 0.3);
              if (band < 0.012 && Math.sin(i * 12.9 + j * 78.2 + Math.floor(t * 0.45) * 3.1) > 0.1) trig = true;
              if (p.inside) {
                const d = Math.hypot(cx - p.x, cy - p.y);
                if (d < S * 1.6) trig = true;
              }
              for (const r of ripples) {
                const d = Math.hypot(cx - r.x, cy - r.y);
                if (Math.abs(d - r.t * S * 9) < S * 0.6) trig = true;
              }
              if (trig && T.cool <= 0) { T.s = T.s ? 0 : 1; T.cool = 0.9; T.hue = 1; }
              const k = Math.min(1, dt * 7);
              T.a += (T.s - T.a) * k;
              T.hue *= Math.exp(-dt * 1.4);
            }

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
            // subtle checker on tiles for depth
            for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
              if ((i + j) & 1) { ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fillRect(i * S, j * S, S, S); }
            }
            const lw = S * 0.3;
            ctx.lineCap = 'butt';
            // pass 2: pre-rendered tile sprites; colors chosen by parity so neighbours always agree
            if (!sprites || sprites.S !== S) buildSprites();
            const SP = S * dpr;
            for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
              const T = tiles[j * cols + i];
              const fr = Math.abs(T.a - Math.round(T.a));
              const lift = Math.sin(Math.PI * fr);
              const par = ((i + j + Math.round(T.a)) & 1);
              const cx = i * S + S / 2, cy = j * S + S / 2;
              if (lift > 0.01) { ctx.fillStyle = '#060b16'; ctx.fillRect(i * S, j * S, S, S); }
              ctx.save();
              ctx.translate(cx - lift * S * 0.04, cy - lift * S * 0.06);
              ctx.rotate(T.a * Math.PI / 2);
              const sc = 1 - lift * 0.14;
              ctx.drawImage(sprites[par], -S / 2 * sc, -S / 2 * sc, S * sc, S * sc);
              if (T.hue > 0.02) { ctx.globalAlpha = T.hue; ctx.drawImage(sprites[2], -S / 2 * sc, -S / 2 * sc, S * sc, S * sc); ctx.globalAlpha = 1; }
              ctx.restore();
            }
            // vignette
            const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
            vg.addColorStop(0, 'rgba(5,10,20,0)'); vg.addColorStop(1, 'rgba(5,10,20,0.55)');
            ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
          } catch (e) { }
        },
        resize,
        destroy() { cv.remove(); }
      };
    }
  });
})();

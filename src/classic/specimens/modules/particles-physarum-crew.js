// A retint of Specimen Atlas's "Physarum Slime Mold" (particles-physarum.js) for How I build:
// the page passes its colours in api.palette ({ bg, mid, accent, hi } as 0-255 RGB) and a
// scroll value in api.drive.value (0..1). More of the crew wakes up as the section is read,
// so the trail network grows with the scroll.
(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'physarum-crew',
  name: 'Physarum Slime Mold',
  family: 'Particles',
  tags: ['canvas', 'agents', 'emergent', 'organic'],
  blurb: 'Tens of thousands of tiny explorers lay down glowing scent and follow each other, and together they weave living vein networks like a slime mold hunting for food.',
  how: 'Each agent sniffs the trail map at three points ahead of it (left, center, right), turns toward the strongest scent, moves, and drops more scent, while the whole map slowly blurs and fades.',
  useFor: 'biotech and network brands, generative posters, ambient loops',
  interact: 'Hold the pointer to drop food, click to regrow',
  init(host, api) {
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:auto;background:#030407';
    host.appendChild(cv);
    var ctx = cv.getContext('2d');
    var off = document.createElement('canvas'), octx = off.getContext('2d');
    var bl = document.createElement('canvas'), bctx = bl.getContext('2d');
    var w0, h0, GW, GH, trail, tmp, img, N, ax, ay, aa, lut;
    var pal = api.palette || {};
    var BG = pal.bg || [19, 14, 11], MID = pal.mid || [70, 48, 30], AC = pal.accent || [246, 152, 53], HI = pal.hi || [252, 240, 225];
    cv.style.background = 'rgb(' + BG.join(',') + ')';
    function buildLut() {
      lut = new Uint8ClampedArray(256 * 3);
      var stops = [[0].concat(BG), [0.3].concat(MID), [0.62].concat(AC), [1].concat(HI)];
      for (var i = 0; i < 256; i++) {
        var t = i / 255, k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
        var a = stops[k], b = stops[k + 1], f = (t - a[0]) / (b[0] - a[0]);
        lut[i * 3] = a[1] + (b[1] - a[1]) * f; lut[i * 3 + 1] = a[2] + (b[2] - a[2]) * f; lut[i * 3 + 2] = a[3] + (b[3] - a[3]) * f;
      }
    }
    buildLut();
    function seed() {
      for (var i = 0; i < N; i++) {
        // the crew starts scattered, so no bright starting ring sits behind the words
        ax[i] = Math.random() * GW; ay[i] = Math.random() * GH; aa[i] = Math.random() * 6.283;
      }
      trail.fill(0);
    }
    function setup(w, h) {
      w0 = w; h0 = h;
      var scale = Math.min(1, Math.sqrt(42000 / Math.max(1, w * h)));
      GW = Math.max(80, Math.round(w * scale)); GH = Math.max(60, Math.round(h * scale));
      off.width = GW; off.height = GH;
      cv.width = Math.round(w); cv.height = Math.round(h);
      trail = new Float32Array(GW * GH); tmp = new Float32Array(GW * GH);
      img = octx.createImageData(GW, GH);
      N = Math.min(8000, Math.round(GW * GH * 0.2));
      bl.width = Math.max(8, GW >> 2); bl.height = Math.max(8, GH >> 2);
      ax = new Float32Array(N); ay = new Float32Array(N); aa = new Float32Array(N);
      seed();
    }
    setup(host.clientWidth, host.clientHeight);
    var warmed = false;
    api.onClick(function () { seed(); warmed = false; });

    var SA = 0.45, RA = 0.42, SO = 8, SS = 1.0, DEP = 0.35;
    function sense(x, y, a) {
      var sx = (x + Math.cos(a) * SO) | 0, sy = (y + Math.sin(a) * SO) | 0;
      if (sx < 0) sx += GW; else if (sx >= GW) sx -= GW;
      if (sy < 0) sy += GH; else if (sy >= GH) sy -= GH;
      return trail[sx + sy * GW];
    }
    return {
      frame: function (t, dt) {
        var steps = 1;
        if (!warmed) { steps = 25; warmed = true; }
        var p = api.pointer;
        var fx = -1, fy = -1;
        if (p && p.inside) { fx = p.nx * GW; fy = p.ny * GH; }
        // slowly breathing parameters for evolving structure
        SO = 7 + 3 * Math.sin(t * 0.13);
        SA = 0.4 + 0.15 * Math.sin(t * 0.09 + 1);
        var live = Math.max(1, Math.round(N * (0.12 + 0.88 * Math.min(1, (api.drive && api.drive.value) || 0))));
        for (var s = 0; s < steps; s++) {
          for (var i = 0; i < live; i++) {
            var x = ax[i], y = ay[i], a = aa[i];
            var F = sense(x, y, a), L = sense(x, y, a - SA), R = sense(x, y, a + SA);
            if (F > L && F > R) {}
            else if (F < L && F < R) a += (Math.random() < 0.5 ? -RA : RA);
            else if (L < R) a += RA; else if (R < L) a -= RA;
            if (fx >= 0) { var dx = fx - x, dy = fy - y, d2 = dx * dx + dy * dy; if (d2 < 900) { var ta = Math.atan2(dy, dx); var da = Math.atan2(Math.sin(ta - a), Math.cos(ta - a)); a += da * 0.08; } }
            x += Math.cos(a) * SS; y += Math.sin(a) * SS;
            if (x < 0) x += GW; else if (x >= GW) x -= GW;
            if (y < 0) y += GH; else if (y >= GH) y -= GH;
            ax[i] = x; ay[i] = y; aa[i] = a;
            var idx = (x | 0) + (y | 0) * GW;
            trail[idx] = Math.min(trail[idx] + DEP, 4);
          }
          // food source from pointer
          if (fx >= 0 && p.down) {
            for (var oy = -4; oy <= 4; oy++) for (var ox = -4; ox <= 4; ox++) {
              var qx = (fx + ox) | 0, qy = (fy + oy) | 0;
              if (qx >= 0 && qy >= 0 && qx < GW && qy < GH) trail[qx + qy * GW] += 1.5;
            }
          }
          // 3x3 box blur with wrap + decay (separable)
          var y2, x2, row;
          for (y2 = 0; y2 < GH; y2++) {
            row = y2 * GW;
            for (x2 = 0; x2 < GW; x2++) {
              var xl = x2 === 0 ? GW - 1 : x2 - 1, xr = x2 === GW - 1 ? 0 : x2 + 1;
              tmp[row + x2] = (trail[row + xl] + trail[row + x2] + trail[row + xr]);
            }
          }
          for (y2 = 0; y2 < GH; y2++) {
            var yu = (y2 === 0 ? GH - 1 : y2 - 1) * GW, yd = (y2 === GH - 1 ? 0 : y2 + 1) * GW; row = y2 * GW;
            for (x2 = 0; x2 < GW; x2++) trail[row + x2] = (tmp[yu + x2] + tmp[row + x2] + tmp[yd + x2]) * (1 / 9) * 0.9;
          }
        }
        var d = img.data, n = GW * GH;
        for (var k = 0; k < n; k++) {
          var v = trail[k]; v = v / (v + 0.9); var li = Math.min(255, (v * v * 330) | 0) * 3;
          var j4 = k << 2; d[j4] = lut[li]; d[j4 + 1] = lut[li + 1]; d[j4 + 2] = lut[li + 2]; d[j4 + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        var W = cv.width, H = cv.height;
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;
        ctx.filter = 'none';
        ctx.drawImage(off, 0, 0, W, H);
        // bloom pass
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.3;
        bctx.imageSmoothingEnabled = true;
        bctx.drawImage(off, 0, 0, bl.width, bl.height);
        ctx.drawImage(bl, 0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        // vignette
        var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(' + BG.join(',') + ',0.85)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      },
      resize: function (w, h) { setup(w, h); },
      destroy: function () { cv.remove(); }
    };
  }
});

(window.SPECIMENS = window.SPECIMENS || []).push({
  id: 'flow-field',
  name: 'Flow Field',
  family: 'Particles',
  tags: ['canvas', 'noise', 'trails', 'vector field'],
  blurb: 'Thousands of tiny particles drift along invisible currents, leaving silky ribbons of color that slowly fade like smoke. It feels like watching wind made visible.',
  how: 'Each spot on the screen gets a direction from a noise function (a smooth, random-looking pattern), and every particle simply steps in the direction under it each frame while old trails fade out.',
  useFor: 'hero backgrounds, music visuals, ambient brand loops',
  interact: 'Move to bend the currents, click to scatter a new palette',
  init(host, api) {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#07060f';
    host.appendChild(cv);
    var vig = document.createElement('div');
    vig.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 45%, rgba(3,2,10,0.75) 100%)';
    host.appendChild(vig);
    var ctx = cv.getContext('2d');
    var W = 0, H = 0;

    // gradient noise
    var perm = new Uint8Array(512);
    function reseedNoise() {
      var p = []; for (var i = 0; i < 256; i++) p[i] = i;
      for (i = 255; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var tmp = p[i]; p[i] = p[j]; p[j] = tmp; }
      for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    }
    reseedNoise();
    function grad(h, x, y, z) {
      var u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : ((h & 15) === 12 || (h & 15) === 14 ? x : z);
      return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
    }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function noise(x, y, z) {
      var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      var u = fade(x), v = fade(y), w = fade(z);
      var A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      function l(a, b, t) { return a + t * (b - a); }
      return l(l(l(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), l(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
        l(l(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), l(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    }

    var palettes = [
      ['#ff3d7f', '#ff8a3d', '#ffd36b', '#36d6ff', '#7a5cff', '#29ffc0'],
      ['#f2e8cf', '#e9c46a', '#f4a261', '#e76f51', '#2a9d8f', '#8ab6d6'],
      ['#a0f0ff', '#5ab0ff', '#7b6dff', '#d86bff', '#ff6bd0', '#ffffff'],
      ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff', '#c6f8ff']
    ];
    var palIdx = 0, pal = palettes[0];
    var N = 0, px, py, ox, oy, life, bucket;
    function spawn(i) {
      px[i] = Math.random() * W; py[i] = Math.random() * H; ox[i] = px[i]; oy[i] = py[i];
      life[i] = 80 + Math.random() * 260;
    }
    function setup(w, h) {
      W = Math.max(2, Math.round(w * dpr)); H = Math.max(2, Math.round(h * dpr));
      cv.width = W; cv.height = H;
      N = Math.min(2200, Math.max(900, Math.round(w * h / 260))); active = Math.min(N, 900);
      px = new Float32Array(N); py = new Float32Array(N); ox = new Float32Array(N); oy = new Float32Array(N);
      life = new Float32Array(N); bucket = new Uint8Array(N);
      for (var i = 0; i < N; i++) spawn(i);
      ctx.fillStyle = '#07060f'; ctx.fillRect(0, 0, W, H);
    }
    setup(host.clientWidth, host.clientHeight);

    api.onClick(function () {
      palIdx = (palIdx + 1) % palettes.length; pal = palettes[palIdx];
      reseedNoise();
      for (var i = 0; i < N; i++) spawn(i);
    });

    var mx = -1e5, my = -1e5;
    var active = Math.min(N, 900);
    return {
      frame: function (t, dt) {
        var speedMul = api.reduced ? 0.35 : 1;
        var p = api.pointer;
        if (p && p.inside) { mx += (p.x * dpr - mx) * 0.2; my += (p.y * dpr - my) * 0.2; if (mx < -1e4) { mx = p.x * dpr; my = p.y * dpr; } }
        else { mx = -1e5; my = -1e5; }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(7,6,15,0.055)';
        ctx.fillRect(0, 0, W, H);
        var scale = 0.0016 / dpr * (900 / Math.max(500, Math.min(W / dpr, 1600))) * 1.4;
        var zt = t * 0.045;
        var step = 1.25 * dpr * speedMul;
        var R = 170 * dpr, R2 = R * R;
        var nb = pal.length;
        var paths = [];
        for (var b = 0; b < nb; b++) paths.push(new Path2D());
        var T0 = performance.now();
        for (var i = 0; i < active; i++) {
          var x = px[i], y = py[i];
          var n = noise(x * scale, y * scale, zt) + 0.5 * noise(x * scale * 2.3 + 40, y * scale * 2.3, zt * 1.7);
          var a = n * Math.PI * 2.4;
          var vx = Math.cos(a), vy = Math.sin(a);
          var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            var d = Math.sqrt(d2) + 1e-3, f = 1 - d / R; f = f * f * 2.6;
            vx += (-dy / d) * f - (dx / d) * f * 0.25; vy += (dx / d) * f - (dy / d) * f * 0.25;
          }
          var cb = ((n + 1.2) * 0.42 * nb) | 0; if (cb < 0) cb = 0; if (cb >= nb) cb = nb - 1;
          var nx2 = x + vx * step * 1.6, ny2 = y + vy * step * 1.6;
          paths[cb].moveTo(x, y); paths[cb].lineTo(nx2, ny2);
          px[i] = nx2; py[i] = ny2;
          life[i] -= 1;
          if (life[i] < 0 || nx2 < -5 || ny2 < -5 || nx2 > W + 5 || ny2 > H + 5) spawn(i);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1.1 * dpr;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.32;
        for (b = 0; b < nb; b++) { ctx.strokeStyle = pal[b]; ctx.stroke(paths[b]); }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        // adapt using the real frame time (dt), since stroking cost is not visible to performance.now() here
        var ms = performance.now() - T0;
        var fdt = dt > 0 ? dt * 1000 : 16;
        if (ms < 6 && fdt < 22 && active < N) active = Math.min(N, active + 100);
        else if ((ms > 12 || fdt > 40) && active > 500) active = Math.max(500, (active * 0.8) | 0);
      },
      resize: function (w, h) { setup(w, h); },
      destroy: function () { cv.remove(); vig.remove(); }
    };
  }
});

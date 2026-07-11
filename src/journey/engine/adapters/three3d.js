/* ThreeWorldAdapter — the true-3D render adapter (ARCHITECTURE.md §3.1).
 * Consumes Frames + world.palette + a LookPreset; paints, never simulates.
 * No Math.random, no layout math, no trigger tests in here — the runtime
 * owns all of that (§0 invariant).
 *
 * Premium set, in the spec's protection order: follow-frustum PCFSoft moon
 * shadow → warm budgeted point-light pool (≤4, nearest lit lanterns) →
 * FogExp2 depth → rim/back light → emissive glow halos (bloom's stand-in
 * until the §5.2 postprocessing CSP spike lands; look.post.bloom maps to
 * halo strength). Tone mapping + exposure from the look. UMD three (global
 * THREE), zero external fetches.
 */
(function () {
  "use strict";
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const ksm = (k, dt) => 1 - Math.pow(1 - k, dt * 60);

  // soft radial sprite texture (procedural — zero asset bytes)
  function glowTexture(inner, outer) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, inner); grad.addColorStop(1, outer);
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function toonRamp(steps, bias) {
    const n = Math.max(2, steps | 0);
    const data = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = Math.round(255 * clamp((i / (n - 1)) + bias * 0.5, 0.06, 1));
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, n, 1);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }
  function seedRng(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // hex → sRGB bytes for canvas fill strings. NEVER route palette hexes
  // through THREE.Color for 2D-canvas painting: with r160 ColorManagement
  // (enabled by default) .r/.g/.b are LINEAR and writing them into an sRGB
  // rgba() string desaturates/darkens the tint (review-confirmed bug).
  const hexBytes = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  function ThreeWorldAdapter(canvas, world, runtime, look) {
    const P = world.palette;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ---- pmndrs post-stack (§5.2 Path B) — present ONLY when the vendored
    // UMD is loaded AND this context grants WebGL2 + float render targets;
    // every other case falls open to the plain renderer + halo sprites (the
    // governor's fallback rung). Never LUT3DEffect (blob: worker, CSP).
    const post = { composer: null, pass: null, bloom: null, active: false };

    const scene = new THREE.Scene();
    // gradient sky from the SAME 3-stop read the canvas paints (§3.2 drawSky):
    // a solid-color background reads flat and swallows the sun/moon disc on
    // bright worlds (desert-confirmed) — night kept the flaw invisible
    const lerpBytes = (h1, h2, t) => {
      const a = hexBytes(h1), b = hexBytes(h2);
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
    };
    (function skyGradient() {
      const c = document.createElement("canvas"); c.width = 2; c.height = 256;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, lerpBytes(P.sky, "#000000", 0.3));      // shade(sky, 0.7)
      grad.addColorStop(0.55, P.sky);
      grad.addColorStop(1, lerpBytes(P.sky, P.ground, 0.5));
      g.fillStyle = grad; g.fillRect(0, 0, 2, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      scene.background = tex;
    })();
    scene.fog = new THREE.FogExp2(new THREE.Color(P.sky), world.atmosphere.fog.density);

    const camera = new THREE.PerspectiveCamera(world.camera.fov, 1, 0.1, 400);

    (function tryPost() {
      const PP = window.POSTPROCESSING;
      if (!PP) return;                               // artifact profile without the vendor script
      const gl = renderer.getContext();
      if (!renderer.capabilities.isWebGL2 || !gl.getExtension("EXT_color_buffer_float")) return;
      try {
        post.composer = new PP.EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
        post.composer.addPass(new PP.RenderPass(scene, camera));
        // bloom and DOF live in SEPARATE passes so looks can toggle each
        // independently (an EffectPass bakes its effect combo at construction)
        post.bloom = new PP.BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.55, intensity: 0.9 });
        post.pass = new PP.EffectPass(camera, post.bloom);
        post.composer.addPass(post.pass);
        post.dof = new PP.DepthOfFieldEffect(camera, { worldFocusRange: 7, bokehScale: 3.5 });
        post.dof.target = new THREE.Vector3();       // per-frame auto-focus point (the fox)
        post.dofPass = new PP.EffectPass(camera, post.dof);
        post.dofPass.enabled = false;               // setLook turns it on for looks with a dof entry
        post.composer.addPass(post.dofPass);
        post.active = true;
      } catch (e) { post.composer = null; post.active = false; }
    })();

    // ---- lit-material registry so setLook can re-skin every surface ----
    const litMats = [];
    function litMat(hex, opts) {
      opts = opts || {};
      // organic surfaces (creatures, foliage) are ALWAYS smooth-shaded —
      // faceting a living form in bright light reads as primitive assembly
      // (user-confirmed on the desert); hard props keep the stylized facets
      const m = new THREE.MeshStandardMaterial({ color: hex, flatShading: !opts.organic });
      m.userData = { hex, opts };
      litMats.push(m);
      return m;
    }

    // ---- lights ----
    const hemi = new THREE.HemisphereLight(new THREE.Color(P.sky).lerp(new THREE.Color("#ffffff"), 0.25), new THREE.Color(P.ground), 0.3);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, world.atmosphere.ambientLevel);
    scene.add(ambient);
    const moonDir = new THREE.DirectionalLight(new THREE.Color(P.moon), 2.2);
    const kd = world.atmosphere.keyLightDir;
    moonDir.castShadow = true;
    moonDir.shadow.mapSize.set(2048, 2048);
    moonDir.shadow.camera.near = 1; moonDir.shadow.camera.far = 80;
    moonDir.shadow.camera.left = -14; moonDir.shadow.camera.right = 14;
    moonDir.shadow.camera.top = 14; moonDir.shadow.camera.bottom = -14;
    moonDir.shadow.bias = -0.0004; moonDir.shadow.normalBias = 0.03;
    const moonTarget = new THREE.Object3D();
    scene.add(moonTarget); moonDir.target = moonTarget;
    scene.add(moonDir);
    // rim/back light: separates the fox from the dark path
    const rim = new THREE.DirectionalLight(new THREE.Color(P.propGlow), 0.5);
    rim.position.set(-6, 3, -8);
    scene.add(rim);
    // budgeted point-light pool (§5.4): ≤4 real lights for nearest lit lanterns
    const POOL = 4;
    const pool = Array.from({ length: POOL }, () => {
      const l = new THREE.PointLight(new THREE.Color(P.propGlow), 0, 14, 1.8);
      scene.add(l); return l;
    });

    // ---- sky group (moon + halo + stars), far-parallax follows the camera ----
    const skyGroup = new THREE.Group(); scene.add(skyGroup);
    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 16),
      new THREE.MeshBasicMaterial({ color: P.moon, fog: false }));
    moonMesh.position.set(10, 13, -55); skyGroup.add(moonMesh);
    const haloTex = glowTexture(`rgba(${P.moonHalo},0.55)`, `rgba(${P.moonHalo},0)`);
    const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
    moonHalo.scale.set(34, 34, 1); moonHalo.position.copy(moonMesh.position); skyGroup.add(moonHalo);
    // ---- aurora curtain (sky, NOT a prop): additive band that scrolls under
    // !reduce. Built in BYTE space — the aurora/aurora2 palette roles are
    // already "r,g,b" strings, so rgba() consumes them directly (no hex parse).
    function auroraTexture() {
      const W = 256, H = 128;
      const c = document.createElement("canvas"); c.width = W; c.height = H;
      const g = c.getContext("2d");
      const a1 = P.aurora.split(",").map(Number);    // teal (lower band)
      const a2 = P.aurora2.split(",").map(Number);   // violet (upper band)
      const img = g.createImageData(W, H);
      for (let x = 0; x < W; x++) {
        // periodic horizontal curtain intensity — seamless across the wrap so
        // scrolling .offset.x never shows a hard seam
        const fx = x / W;
        const streak = clamp(0.45 + 0.35 * Math.sin(fx * Math.PI * 2 * 3)
          + 0.20 * Math.sin(fx * Math.PI * 2 * 7 + 1.7), 0, 1);
        for (let y = 0; y < H; y++) {
          const t = y / H;                            // 0 top → 1 bottom
          const env = Math.sin(t * Math.PI);          // 0 at both edges → transparent top & bottom
          const r = Math.round(a2[0] + (a1[0] - a2[0]) * t);
          const gg = Math.round(a2[1] + (a1[1] - a2[1]) * t);
          const b = Math.round(a2[2] + (a1[2] - a2[2]) * t);
          const idx = (y * W + x) * 4;
          img.data[idx] = r; img.data[idx + 1] = gg; img.data[idx + 2] = b;
          img.data[idx + 3] = Math.round(255 * env * streak * 0.9);
        }
      }
      g.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    // only worlds that author both aurora roles get the band — night-path /
    // desert palettes have no aurora/aurora2, so they skip it entirely
    let auroraTex = null, auroraMat = null;
    if (P.aurora && P.aurora2) {
      auroraTex = auroraTexture();
      auroraMat = new THREE.MeshBasicMaterial({
        map: auroraTex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
        depthWrite: false, fog: false, side: THREE.DoubleSide });
      // lowered into the visible sky band (the camera looks slightly down), tilted
      // toward the viewer so the curtains read as a ceiling of light
      const auroraMesh = new THREE.Mesh(new THREE.PlaneGeometry(180, 40), auroraMat);
      auroraMesh.position.set(0, 19, -58); auroraMesh.rotation.x = -0.32; skyGroup.add(auroraMesh);
    }
    let starsPts = null;   // star layout arrives from the seeded runtime — adapter only places it
    function buildStars(stars) {
      const pos = new Float32Array(stars.length * 3);
      stars.forEach((s, i) => {
        pos[i * 3] = (s.u - 0.5) * 200; pos[i * 3 + 1] = 6 + s.v * 60; pos[i * 3 + 2] = -80 - s.r * 10;
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      starsPts = new THREE.Points(g, new THREE.PointsMaterial({
        color: P.moon, size: 0.55, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.85 }));
      starsPts.material.fog = false;
      skyGroup.add(starsPts);
    }

    // ---- terrain + distance layers ----
    const LEN = runtime.len;
    // procedural ground texture (the textures.js seam — zero asset bytes):
    // mottled earth + moss patches + fine speckle, tinted from the palette
    function groundTexture() {
      const c = document.createElement("canvas"); c.width = c.height = 512;
      const g = c.getContext("2d");
      g.fillStyle = P.ground; g.fillRect(0, 0, 512, 512);
      const rng = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(world.seed);
      // patch tints derive from the palette (E4) so a new world recolors its
      // ground mottle for free — night stays purple/moss, desert reads sandy.
      // Lerp in sRGB BYTE space (matches canvas25d's mix() and the base fill);
      // a THREE.Color lerp would happen in linear space and grey the hue out.
      const patchRGBA = (hex, toward, amt, alpha) => {
        const a = hexBytes(hex), b = hexBytes(toward);
        const m = (i) => Math.round(a[i] + (b[i] - a[i]) * amt);
        return `rgba(${m(0)},${m(1)},${m(2)},${alpha})`;
      };
      // snow: COOL blue-shadow patches (toward hills / rockShade) + BRIGHT
      // highlight patches (toward snow / #fff). No warm tint — moonlit snow.
      const shadowPatch = patchRGBA(P.ground, P.rockShade || "#333d54", 0.5, 0.16);
      const shadowPatch2 = patchRGBA(P.ground, P.hills || "#26374f", 0.42, 0.13);
      const litPatch = patchRGBA(P.ground, P.snow || "#ffffff", 0.6, 0.18);
      for (let i = 0; i < 60; i++) {          // broad soft drifts (packed snow / shadow pools)
        const x = rng() * 512, y = rng() * 512, r = 30 + rng() * 90;
        const bright = rng() < 0.45;
        const cool = rng() < 0.5;
        // the texture REPEATS across the ground — patches must wrap around
        // the tile edges or every repeat shows a hard seam (invisible on
        // near-black night ground, glaring on BRIGHT snow — mandatory here)
        for (let dx = -512; dx <= 512; dx += 512) for (let dy = -512; dy <= 512; dy += 512) {
          if (x + dx < -r || x + dx > 512 + r || y + dy < -r || y + dy > 512 + r) continue;
          const grd = g.createRadialGradient(x + dx, y + dy, 2, x + dx, y + dy, r);
          grd.addColorStop(0, bright ? litPatch : (cool ? shadowPatch : shadowPatch2));
          grd.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = grd; g.beginPath(); g.arc(x + dx, y + dy, r, 0, 6.29); g.fill();
        }
      }
      // byte-space band/speck tints (cold): bright snow vs cool blue-shadow
      const snowB = hexBytes(P.snow || "#ffffff").join(",");
      const shadeB = hexBytes(P.rockShade || "#333d54").join(",");
      for (let i = 0; i < 9; i++) {           // a few soft wind-drift bands, barely-there
        const y = rng() * 512, len = 120 + rng() * 180, x = rng() * 512;
        const light = rng() < 0.5;
        g.fillStyle = light ? `rgba(${snowB},0.03)` : `rgba(${shadeB},0.04)`;
        for (let dx = -512; dx <= 512; dx += 512) {     // wrap like the patches
          g.beginPath(); g.ellipse(x + dx, y, len, 6 + rng() * 9, 0, 0, 6.29); g.fill();
        }
      }
      for (let i = 0; i < 4200; i++) {        // fine sparkle (snow crystals) — more bright than dark
        const v = rng();
        g.fillStyle = v < 0.58 ? `rgba(${snowB},0.09)` : `rgba(${shadeB},0.07)`;
        g.fillRect(rng() * 512, rng() * 512, 1 + rng() * 1.6, 1 + rng() * 1.4);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(LEN / 14, 3);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    }
    function groundMesh() {
      const seg = 300;
      const geo = new THREE.PlaneGeometry(LEN + 60, 36, seg, 6);
      geo.rotateX(-Math.PI / 2);
      const posA = geo.attributes.position;
      for (let i = 0; i < posA.count; i++) {
        const x = posA.getX(i) + LEN / 2;
        posA.setY(i, runtime.groundAt(x));
      }
      geo.computeVertexNormals();
      // texture carries the palette color; the material multiplier is a
      // WORLD role (groundTint) — the old baked #a99bb5 night-lavender cut
      // desert sand to muddy brown while the canvas painted it warm
      const mat = litMat(P.groundTint || "#a99bb5", { roughMul: 1.35 });   // snow is matte
      mat.map = groundTexture();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = LEN / 2;
      mesh.receiveShadow = true;
      return mesh;
    }
    scene.add(groundMesh());
    function ribbonLayer(layer) {
      const pts = [];
      const step = 4;
      for (let x = -30; x <= LEN + 30; x += step) pts.push([x, runtime.layerProfileAt(layer, x)]);
      const shape = new THREE.Shape();
      shape.moveTo(pts[0][0], -20);
      for (const [x, y] of pts) shape.lineTo(x, y + layer.z * 0.12 + 2);
      shape.lineTo(pts[pts.length - 1][0], -20);
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color: P[layer.paletteRole], fog: false }));
      mesh.position.z = -layer.z;
      return mesh;
    }
    for (const layer of world.layers) if (layer.kind === "ridge" || layer.kind === "hills") scene.add(ribbonLayer(layer));

    // ---- grass tufts (instanced) ----
    let grassIM = null;
    function buildGrass(tufts) {
      const geo = new THREE.ConeGeometry(0.045, 1, 5);
      geo.translate(0, 0.5, 0);
      grassIM = new THREE.InstancedMesh(geo, litMat(P.grass, {}), tufts.length);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
      tufts.forEach((tf, i) => {
        e.set(0, 0, tf.lean); q.setFromEuler(e);
        s.set(1, tf.h, 1);
        m.compose(new THREE.Vector3(tf.x, runtime.groundAt(tf.x), tf.z), q, s);
        grassIM.setMatrixAt(i, m);
      });
      grassIM.instanceMatrix.needsUpdate = true;
      scene.add(grassIM);
    }

    // ---- prop factory ----
    // halo sprite tinted from the WORLD's propGlow — never a baked literal,
    // even one that happens to equal the current world's value (night-gold
    // rendered desert campfires the wrong colour; review-confirmed)
    const pgRgb = hexBytes(P.propGlow).join(",");
    const glowSpriteTex = glowTexture(`rgba(${pgRgb},0.6)`, `rgba(${pgRgb},0)`);
    const propViews = new Map();
    function makeLantern(p) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), litMat("#241a18", {}));
      pole.position.y = 1.2; pole.castShadow = true; g.add(pole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), litMat("#241a18", {}));
      arm.rotation.z = Math.PI / 2; arm.position.set(0.32, 2.3, 0); g.add(arm);
      const paperMat = new THREE.MeshStandardMaterial({
        color: P.propPaper, emissive: new THREE.Color(P.propGlow), emissiveIntensity: 0.05, flatShading: true });
      const paper = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 12), paperMat);
      paper.scale.y = 1.25; paper.position.set(0.62, 2.0, 0); paper.castShadow = true; g.add(paper);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSpriteTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      halo.position.copy(paper.position); halo.scale.set(0.001, 0.001, 1); g.add(halo);
      return { group: g, paperMat, halo, lightAnchor: paper.position.clone() };
    }
    function makeTree(p) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 2.6, 7), litMat(P.trunk, {}));
      trunk.position.y = 1.3; trunk.rotation.z = 0.08; trunk.castShadow = true; g.add(trunk);
      const canopyMat = litMat(P.canopy, { organic: true });
      [[0, 3.1, 0, 1.15], [-0.8, 2.7, 0.2, 0.8], [0.85, 2.8, -0.15, 0.9], [0.15, 3.6, 0.1, 0.7]].forEach(([x, y, z, r]) => {
        const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), canopyMat);
        c.position.set(x, y, z); c.castShadow = true; g.add(c);
      });
      // blossom speckle
      const n = 46, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const rng = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(p.seed);
      for (let i = 0; i < n; i++) {
        const a = rng() * 6.28, b = rng() * 3.14, r = 0.9 + rng() * 0.7;
        pos[i * 3] = Math.cos(a) * Math.sin(b) * r * 1.2;
        pos[i * 3 + 1] = 3.05 + Math.cos(b) * r * 0.75;
        pos[i * 3 + 2] = Math.sin(a) * Math.sin(b) * r * 0.8;
        const c = new THREE.Color(P.blossom[i % P.blossom.length]);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      bg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.add(new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.09, vertexColors: true })));
      return { group: g };
    }
    function makeTorii(p) {
      const g = new THREE.Group();
      const mat = litMat(P.torii, {});
      const mkBox = (w, h, d, x, y, z, rz) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        b.position.set(x, y, z); if (rz) b.rotation.z = rz; b.castShadow = true; g.add(b); return b;
      };
      mkBox(0.22, 3.4, 0.22, -1.5, 1.7, 0, 0.035);
      mkBox(0.22, 3.4, 0.22, 1.5, 1.7, 0, -0.035);
      mkBox(3.6, 0.2, 0.26, 0, 2.55, 0, 0);
      const lintel = mkBox(4.4, 0.3, 0.34, 0, 3.35, 0, 0);
      lintel.geometry.translate(0, 0, 0);
      mkBox(0.16, 0.7, 0.18, 0, 2.95, 0, 0);
      return { group: g };
    }
    function makeRock(p) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), litMat(P.rock || "#2c2338", {}));   // palette-driven (E3)
      r.scale.y = 0.62; r.position.y = 0.16; r.castShadow = true;
      const g = new THREE.Group(); g.add(r);
      return { group: g };
    }
    // ---- desert prop TYPES (§6.4 seam: one factory per adapter per new type) ----
    function makeCactus(p) {
      const g = new THREE.Group();
      const bodyMat = litMat(P.cactusBody || "#5e7d52", { organic: true });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 3.0, 16), bodyMat);
      trunk.position.y = 1.5; trunk.castShadow = true; g.add(trunk);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), bodyMat);
      cap.position.y = 3.0; cap.castShadow = true; g.add(cap);
      [[1, 1.5], [-1, 1.2]].forEach(([side, h]) => {          // elbow curves up into the arm
        const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.14, 8, 12, Math.PI / 2), bodyMat);
        elbow.position.set(side * 0.42, h + 0.28, 0);
        elbow.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI;
        elbow.castShadow = true; g.add(elbow);
        const up = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.145, 0.85, 12), bodyMat);
        up.position.set(side * 0.72, h + 0.7, 0); up.castShadow = true; g.add(up);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8), bodyMat);
        tip.position.set(side * 0.72, h + 1.12, 0); g.add(tip);
      });
      const n = 10, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), rng = seedRng(p.seed);
      for (let i = 0; i < n; i++) {                            // cream crown flowers (the shed source)
        const a = rng() * 6.28, r = 0.2 + rng() * 0.12;
        pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 3.05 + rng() * 0.15; pos[i * 3 + 2] = Math.sin(a) * r;
        const c = new THREE.Color(P.blossom[i % P.blossom.length]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      bg.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.add(new THREE.Points(bg, new THREE.PointsMaterial({ size: 0.12, vertexColors: true })));
      return { group: g };
    }
    function makeCampfire(p) {
      const g = new THREE.Group();
      const stoneMat = litMat(P.rock || "#8a7a5e", {}), logMat = litMat(P.trunk || "#6b4a2e", {}), rng = seedRng(p.seed);
      for (let i = 0; i < 7; i++) {                            // stone ring
        const a = (i / 7) * Math.PI * 2, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + rng() * 0.05, 0), stoneMat);
        s.position.set(Math.cos(a) * 0.42, 0.08, Math.sin(a) * 0.42); s.castShadow = true; g.add(s);
      }
      [0.5, -0.5].forEach((r) => {                             // crossed logs
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), logMat);
        log.rotation.set(0, r, Math.PI / 2); log.position.y = 0.1; log.castShadow = true; g.add(log);
      });
      // flame: dark ember base + emissive that the generic pool/emissive loop
      // drives from activation (unlit → near-black kindling; lit → glowing).
      // Returns the SAME {paperMat, halo, lightAnchor} shape the lantern does,
      // so the point-light pool lights a campfire with ZERO loop changes.
      const flameMat = new THREE.MeshStandardMaterial({
        color: "#2a1509", emissive: new THREE.Color(P.propGlow), emissiveIntensity: 0.05, flatShading: true });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.58, 7), flameMat);
      flame.position.y = 0.4; g.add(flame);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSpriteTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      halo.position.set(0, 0.5, 0); halo.scale.set(0.001, 0.001, 1); g.add(halo);
      return { group: g, paperMat: flameMat, halo, lightAnchor: new THREE.Vector3(0, 0.5, 0) };
    }
    function makeSkull(p) {
      const g = new THREE.Group();
      const boneMat = litMat(P.bone || "#e8ddc4", {}), hornMat = litMat(P.boneShade || "#b6a888", {});
      const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), boneMat);
      cranium.scale.set(1, 0.9, 1.1); cranium.position.y = 0.22; cranium.castShadow = true; g.add(cranium);
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 7), boneMat);
      snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.16, 0.28); snout.castShadow = true; g.add(snout);
      [-1, 1].forEach((side) => {                              // curved horns
        // torus arc stays in the lateral X-Y plane so horns sweep out to the
        // sides like the 2.5D draw (a Y-rotation collapses them into depth)
        const horn = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 6, 10, Math.PI * 0.8), hornMat);
        horn.position.set(side * 0.14, 0.4, 0); horn.rotation.set(0, 0, side * 0.6); horn.castShadow = true; g.add(horn);
      });
      const socketMat = litMat("#2a2318", {});
      [-1, 1].forEach((side) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), socketMat);
        s.position.set(side * 0.12, 0.24, 0.22); g.add(s);
      });
      return { group: g };
    }
    function makeArch(p) {
      const g = new THREE.Group();
      const mat = litMat(P.arch || "#c0895a", {});
      const legGeo = new THREE.BoxGeometry(0.5, 3.2, 0.55);
      const L = new THREE.Mesh(legGeo, mat); L.position.set(-1.35, 1.6, 0); L.rotation.z = 0.05; L.castShadow = true; g.add(L);
      const Rg = new THREE.Mesh(legGeo, mat); Rg.position.set(1.35, 1.6, 0); Rg.rotation.z = -0.05; Rg.castShadow = true; g.add(Rg);
      const span = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.34, 8, 18, Math.PI), mat);   // half-torus arch reads as a gateway
      span.position.set(0, 3.15, 0); span.castShadow = true; g.add(span);
      return { group: g };
    }
    // ---- alpine prop TYPES (§6.4 seam: one factory per adapter per new type) ----
    function makePine(p) {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.1, 7), litMat(P.trunk, {}));
      trunk.position.y = 0.55; trunk.castShadow = true; g.add(trunk);
      // 3 stacked needle tiers, wide→narrow bottom→top (organic = smooth foliage)
      const needleMat = litMat(P.canopy, { organic: true });
      [[0.95, 1.3, 1.05], [0.72, 1.15, 1.95], [0.5, 1.0, 2.7]].forEach(([r, h, y]) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), needleMat);
        cone.position.y = y; cone.castShadow = true; g.add(cone);
      });
      // bright snow-cap on the top tier
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.6, 9), litMat(P.snow, { organic: true }));
      cap.position.y = 3.05; cap.castShadow = true; g.add(cap);
      return { group: g };
    }
    // cabin — LIGHTABLE: amber windows latch on as the shepherd passes. Shares
    // ONE winMat + ONE halo so the generic emissive loop (§3b) drives both windows.
    function makeCabin(p) {
      const g = new THREE.Group();
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.0), litMat(P.cabin, {}));
      walls.position.y = 0.9; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
      // hip (pyramid) roof over the box — no open gables; snow layer caps it
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.2, 4), litMat(P.cabinRoof, {}));
      roof.rotation.y = Math.PI / 4; roof.position.y = 2.4; roof.castShadow = true; g.add(roof);
      const snowRoof = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.05, 4), litMat(P.snow, {}));
      snowRoof.rotation.y = Math.PI / 4; snowRoof.position.y = 2.5; snowRoof.castShadow = true; g.add(snowRoof);
      // amber windows facing the trail/camera (+Z long face, toward the viewer)
      // plus one on the -X face seen on approach — campfire emissive pattern
      const winMat = new THREE.MeshStandardMaterial({
        color: "#1a1206", emissive: new THREE.Color(P.propGlow), emissiveIntensity: 0.05, flatShading: true });
      [-0.55, 0.55].forEach((x) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.72), winMat);
        win.position.set(x, 0.98, 1.02); g.add(win); // +Z face
      });
      const winApproach = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat);
      winApproach.position.set(-1.22, 0.98, 0.3); winApproach.rotation.y = -Math.PI / 2; g.add(winApproach); // -X face
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSpriteTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      halo.position.set(0, 1.0, 1.25); halo.scale.set(0.001, 0.001, 1); g.add(halo);
      return { group: g, paperMat: winMat, halo, lightAnchor: new THREE.Vector3(0, 1.0, 1.3) };
    }
    // chairlift — LIGHTABLE: A-frame tower + cable stub + hanging chair + amber
    // tower lamp that latches lit (same emissive/pool contract as the lantern)
    function makeChairlift(p) {
      const g = new THREE.Group();
      const steelMat = litMat(P.trunk, {});
      [-1, 1].forEach((side) => {                              // splayed A-frame legs
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6.6, 6), steelMat);
        leg.position.set(0, 3.2, side * 0.55); leg.rotation.x = side * 0.12; leg.castShadow = true; g.add(leg);
      });
      const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 6), steelMat);
      cross.rotation.x = Math.PI / 2; cross.position.set(0, 4.6, 0); cross.castShadow = true; g.add(cross);
      const armS = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), steelMat);   // sheave arm over the trail
      armS.rotation.z = Math.PI / 2; armS.position.set(0.5, 6.2, 0); armS.castShadow = true; g.add(armS);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5.0, 4), steelMat);  // thin cable stub
      cable.rotation.z = Math.PI / 2 - 0.08; cable.position.set(-1.6, 6.3, 0); cable.castShadow = false; g.add(cable);
      const chairMat = litMat(P.torii, {});
      const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 4), steelMat);
      hanger.position.set(1.0, 5.5, 0); hanger.castShadow = false; g.add(hanger);
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.6), chairMat);
      chair.position.set(1.0, 4.4, 0); chair.castShadow = true; g.add(chair);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.6), chairMat);
      back.position.set(0.7, 4.7, 0); back.castShadow = true; g.add(back);
      const lampMat = new THREE.MeshStandardMaterial({
        color: "#1a1206", emissive: new THREE.Color(P.propGlow), emissiveIntensity: 0.05, flatShading: true });
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), lampMat);
      lamp.position.set(0.2, 6.2, 0); g.add(lamp);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowSpriteTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      halo.position.copy(lamp.position); halo.scale.set(0.001, 0.001, 1); g.add(halo);
      return { group: g, paperMat: lampMat, halo, lightAnchor: lamp.position.clone() };
    }
    // frozen lake — a RAW (non-litMat) high-metalness plane so setLook never
    // overwrites its metalness; takes moon + point-light specular as ice sheen
    function makeFrozenLake(p) {
      const g = new THREE.Group();
      const iceMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(P.lakeIce), metalness: 0.8, roughness: 0.12 });
      const ice = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), iceMat);
      ice.rotation.x = -Math.PI / 2; ice.position.y = -0.05; ice.receiveShadow = true; g.add(ice);
      return { group: g };
    }
    const FACTORY = { "paper-lantern": makeLantern, "cherry-tree": makeTree, "torii": makeTorii, "rock": makeRock,
                      "cactus": makeCactus, "campfire": makeCampfire, "skull": makeSkull, "arch": makeArch,
                      // alpine additions ("trail-lantern" ALIASES the lantern → free
                      // activation-latch glow; "trail-gate" ALIASES the torii timber gate)
                      "pine": makePine, "cabin": makeCabin, "chairlift": makeChairlift, "frozen-lake": makeFrozenLake,
                      "trail-lantern": makeLantern, "trail-gate": makeTorii };

    // ---- petals pool (meshes reused frame to frame) ----
    const petalGeo = new THREE.PlaneGeometry(0.14, 0.09);
    const petalMat = new THREE.MeshBasicMaterial({ color: P.blossom[1], side: THREE.DoubleSide, transparent: true });
    const petalPool = Array.from({ length: 40 }, () => {
      const m = new THREE.Mesh(petalGeo, petalMat); m.visible = false; scene.add(m); return m;
    });

    // ---- fireflies (additive sprites) ----
    const flyTex = glowTexture("rgba(255,212,94,0.9)", "rgba(255,212,94,0)");
    let flySprites = [];
    function buildFlies(flies) {
      flySprites = flies.map(() => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
          map: flyTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
        s.scale.set(0.22, 0.22, 1); scene.add(s); return s;
      });
    }

    // ---- procedural fox: bones from the shared anatomy contract ----
    const fox = new THREE.Group(); scene.add(fox);
    const boneMeshes = {};
    const furMat = () => litMat(P.protagFur, { roughMul: 1, organic: true });
    const darkMat = () => litMat(P.protagDark, { organic: true });
    const inkMat = () => litMat(P.protagInk, { organic: true });
    const creamMat = () => litMat(P.protagCream, { organic: true });
    function bone(name, r1, r2, mat) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, 1, 10), mat);
      m.castShadow = true; fox.add(m); boneMeshes[name] = m; return m;
    }
    // limbs: 3 bones each, radii from the SHARED anatomy contract (never local numbers)
    const FAMLIMBS = window.WorldAnatomy.FAMILIES[world.protagonist.family].limbs;
    for (const limb of ["hindNear", "foreNear", "hindFar", "foreFar"]) {
      const far = limb.endsWith("Far");
      const L = FAMLIMBS[limb.startsWith("hind") ? "hind" : "fore"];
      bone(limb + "0", L.upperR, L.midR, far ? darkMat() : furMat());
      bone(limb + "1", L.midR, L.lowR, far ? darkMat() : furMat());
      bone(limb + "2", L.lowR, L.lowR * 0.8, inkMat());
    }
    // body: capsule-ish scaled sphere; chest + haunch (organic = smooth,
    // generous segments — coarse faceted spheres read as slop in daylight)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), furMat());
    body.scale.set(1.42, 0.62, 0.56); body.castShadow = true; fox.add(body);
    // sable SADDLE: a dark cap sitting high/back on the spine (GSD black-and-tan)
    const saddle = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), darkMat());
    saddle.scale.set(1.15, 0.5, 0.5); saddle.castShadow = true; fox.add(saddle);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), creamMat());
    chest.scale.set(0.8, 0.72, 0.5); chest.castShadow = false; fox.add(chest);
    const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12), furMat());
    haunch.scale.set(0.9, 0.95, 0.62); fox.add(haunch);
    // neck: connects chest to head — without it the head floats, and the
    // low-sun cast shadow shows a DETACHED head blob (user-reported)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 1, 12), furMat());
    neck.castShadow = true; fox.add(neck);
    // head group
    const head = new THREE.Group(); fox.add(head);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 12), furMat());
    skull.castShadow = true; head.add(skull);
    // longer BLACK muzzle (GSD): ink snout + ink underside; nose pushed forward
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 14), inkMat());
    snout.rotation.z = -Math.PI / 2; snout.position.set(0.3, -0.05, 0); snout.castShadow = true; head.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), inkMat());
    nose.position.set(0.62, -0.05, 0); head.add(nose);
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), inkMat());
    jaw.scale.set(1.3, 0.6, 0.7); jaw.position.set(0.22, -0.14, 0); head.add(jaw);
    const eyes = [];
    for (const sgn of [-1, 1]) {
      // taller ERECT ears, reduced splay — the GSD's signature pricked ear
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.44, 4), furMat());
      ear.position.set(-0.06, 0.32, sgn * 0.13); ear.rotation.x = sgn * 0.10; ear.castShadow = true; head.add(ear);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), inkMat());
      tip.position.set(-0.06, 0.54, sgn * 0.145); tip.rotation.x = sgn * 0.10; head.add(tip);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), inkMat());
      eye.position.set(0.16, 0.05, sgn * 0.16); head.add(eye); eyes.push(eye);
    }
    // tail bones + cream tip
    const tailBones = [];
    for (let i = 0; i < 4; i++) {
      const r = lerp(0.13, 0.06, i / 3);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, 1, 10), i === 3 ? inkMat() : furMat());
      m.castShadow = true; fox.add(m); tailBones.push(m);
    }
    // soft contact blob under the fox (tight dark core PCF washes out — §3.1)
    const contact = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20),
      new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0,0,0,0.5)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false }));
    contact.rotation.x = -Math.PI / 2; scene.add(contact);

    // ---- STUDIO PROFILE (§5.5): Quaternius CC0 animated fox ----
    // Presence of the vendored asset IS the profile switch — artifact builds
    // simply don't include the script. The GLB consumes the SAME Frame: clip
    // time derives from gaitPhase (distance-driven), so the baked walk is
    // foot-locked to travel exactly like the procedural FK (§3.1). atob →
    // ArrayBuffer → parse: zero fetches, artifact-CSP safe.
    const studio = { ready: false, calibrated: false, wrap: null,
                     mixer: null, walk: null, idle: null, gallop: null,
                     targetH: 0.8,        // desired WORLD height (matches the procedural fox)
                     // per-clip baked stride in WORLD units, auto-measured at
                     // calibration by sweeping each clip and taking the foot
                     // effector's x-span. Foot-lock = distance / OWN stride.
                     strideWalk: 0.31, strideGallop: 0.64,
                     walkCyc: 0, galCyc: 0, lastWx: null };
    if (window.VENDOR_ASSETS && window.VENDOR_ASSETS.foxGlbB64 && THREE.GLTFLoader) {
      try {
        const b64 = window.VENDOR_ASSETS.foxGlbB64;
        const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
        new THREE.GLTFLoader().parse(bytes.buffer, "", (gltf) => {
          const model = gltf.scene;
          // NOTE: a load-time Box3 is WRONG for skinned meshes (bind-pose
          // geometry vs armature space diverge on Blender exports) — real
          // scale/grounding is self-calibrated on the first rendered frame
          // from the SKINNED world bounds (see render()).
          const wrap = new THREE.Group();
          wrap.rotation.y = Math.PI / 2;           // Quaternius forward (+Z) → travel axis (+X)
          wrap.add(model);
          studio.wrap = wrap;
          const seen = new Set();
          model.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              if (!seen.has(o.material)) {         // register for live look re-grades
                seen.add(o.material);
                o.material.userData = { hex: "#" + o.material.color.getHexString(), opts: { organic: true } };
                litMats.push(o.material);
              }
            }
          });
          studio.mixer = new THREE.AnimationMixer(model);
          const clip = (n) => THREE.AnimationClip.findByName(gltf.animations, n);
          const act = (n) => { const c = clip(n); if (!c) return null; const a = studio.mixer.clipAction(c); a.play(); a.weight = 0; return a; };
          studio.walk = act("Walk"); studio.idle = act("Idle"); studio.gallop = act("Gallop");
          if (studio.walk && studio.idle) {
            for (const child of fox.children) child.visible = false;  // retire the procedural fox
            fox.add(wrap);
            studio.ready = true;
            setLook(LOOK);                          // grade the new materials immediately
          }
        }, (err) => { /* parse failed → procedural fox stays (fail-open to the artifact path) */ });
      } catch (e) { /* malformed asset → procedural fox stays */ }
    }

    const V = { a: new THREE.Vector3(), b: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) };
    function placeBone(mesh, ax, ay, az, bx, by, bz) {
      V.a.set(ax, ay, az); V.b.set(bx, by, bz);
      const len = Math.max(V.a.distanceTo(V.b), 1e-4);
      mesh.position.copy(V.a).add(V.b).multiplyScalar(0.5);
      mesh.scale.set(1, len, 1);
      mesh.quaternion.setFromUnitVectors(V.up, V.b.sub(V.a).normalize());
    }

    // ---- look application (live re-grade: proof gate §7.2) ----
    let LOOK = look;
    function setLook(nl) {
      LOOK = nl;
      const tone = { AgX: THREE.AgXToneMapping, ACES: THREE.ACESFilmicToneMapping,
                     Cineon: THREE.CineonToneMapping, Reinhard: THREE.ReinhardToneMapping,
                     Neutral: THREE.LinearToneMapping, none: THREE.NoToneMapping }[nl.tone.mapping];
      renderer.toneMapping = tone == null ? THREE.ACESFilmicToneMapping : tone;
      renderer.toneMappingExposure = nl.tone.exposure;
      moonDir.intensity = nl.lighting.keyIntensity;
      moonDir.color.set(P.moon).multiply(new THREE.Color(nl.lighting.moonColorMul));
      ambient.intensity = world.atmosphere.ambientLevel * (nl.lighting.ambient / 0.25);
      hemi.intensity = 0.15 + nl.lighting.ambient * 0.3;
      moonDir.shadow.radius = nl.lighting.shadowSoftness;
      const ms = Math.min(nl.lighting.shadowMapSize, 2048);   // governor-lite cap
      if (moonDir.shadow.mapSize.x !== ms) {
        moonDir.shadow.mapSize.set(ms, ms);
        if (moonDir.shadow.map) { moonDir.shadow.map.dispose(); moonDir.shadow.map = null; }
      }
      scene.fog.density = world.atmosphere.fog.density * nl.fog.densityMul;
      // material re-grade across the whole lit registry, in place. For "toon",
      // the proof approximates with max roughness + smooth shading + raised
      // ambient (a real MeshToonMaterial swap is the §6.3 registered-pass path).
      for (const m of litMats) {
        m.roughness = clamp(nl.material.roughness * (m.userData.opts.roughMul || 1), 0, 1);
        m.metalness = nl.material.metalness;
        m.flatShading = m.userData.opts.organic ? false
          : (nl.material.model === "toon" ? false : nl.material.flatShading);
        m.needsUpdate = true;
      }
      // TRUE toon shading (§6.3 registered pass): model "toon" swaps every
      // lit mesh to a MeshToonMaterial twin (banded gradientMap from the
      // look's toonSteps/rampBias) — per-OBJECT shading, never a frame LUT.
      // Twins are cached per base material; leaving toon restores the base.
      const toon = nl.material.model === "toon";
      const rampKey = nl.material.toonSteps + "/" + nl.material.rampBias;
      let ramp = null;
      const getRamp = () => ramp || (ramp = toonRamp(nl.material.toonSteps, nl.material.rampBias));
      scene.traverse((o) => {
        if (!o.isMesh) return;
        const m = o.material;
        if (toon) {
          const base = m.userData && m.userData.isToonTwin ? m.userData.base : m;
          if (!(base.userData && base.userData.hex)) return;   // only lit-registry materials
          if (!base.userData.toonTwin || base.userData.toonKey !== rampKey) {
            const t = new THREE.MeshToonMaterial({ color: base.color, gradientMap: getRamp() });
            if (base.map) t.map = base.map;
            t.userData = { isToonTwin: true, base };
            base.userData.toonTwin = t;
            base.userData.toonKey = rampKey;
          }
          o.material = base.userData.toonTwin;
        } else if (m.userData && m.userData.isToonTwin) {
          o.material = m.userData.base;
        }
      });
      bloomHaloMul = 0.6;
      let bloomFx = null;
      for (const fx of nl.post) if (fx.type === "bloom") { bloomFx = fx; bloomHaloMul = fx.strength * 1.4; }
      if (post.composer) {
        if (bloomFx) {
          post.pass.enabled = true;
          post.bloom.luminanceMaterial.threshold = bloomFx.threshold;
          post.bloom.intensity = bloomFx.strength;
          // real HDR bloom carries the glow now — the halo sprites drop to a
          // soft core so lit props don't double-glow
          bloomHaloMul *= 0.4;
        } else {
          post.pass.enabled = false;                 // look without bloom → straight pipeline
        }
        let dofFx = null;
        for (const fx of nl.post) if (fx.type === "dof") dofFx = fx;
        post.dofPass.enabled = !!dofFx;
        if (dofFx) post.dof.bokehScale = dofFx.bokeh || 3.5;
      }
      // shared grade rig (§2.5): lift/gamma/gain, tempBias, blackPoint,
      // contrast, saturation — tone:false because the renderer tone-maps
      // natively; both adapters end up with ONE colour identity per look
      if (window.WorldGrade) window.WorldGrade.apply(canvas, nl, { tone: false });
    }
    let bloomHaloMul = 1;
    setLook(look);

    // ---- per-frame ----
    let yaw = 0, built = false, lastT = null, lookSynced = false;
    function render(frame) {
      if (!built) { buildStars(frame.particles.stars); buildFlies(frame.particles.flies); buildGrass(frame.tufts); built = true; }
      const dt = lastT == null ? 1 / 60 : clamp(frame.t - lastT, 1 / 240, 0.05);
      lastT = frame.t;
      const pr = frame.protagonist, pose = pr.pose;
      // shoulder-height units → world units; MUST match the runtime's foot-lock
      // cadence, so it is world DATA, not an adapter constant
      const S = (world.protagonist.renderScale || 0.72) * (world.protagonist.scale || 1);
      fox.position.set(pr.root[0], pr.root[1], 0);
      fox.scale.set(S, S, S);
      const targetYaw = pr.facing > 0 ? 0 : Math.PI;
      yaw = lerp(yaw, targetYaw, ksm(0.14, dt));  // dt-normalized: same turn at any refresh rate
      fox.rotation.y = yaw;

      if (studio.ready) {
        // GLB fox, foot-locked per clip (§3.1): each clip's cycle count
        // integrates distance / that clip's OWN baked stride, so a planted
        // paw stays world-fixed at either gait. Cadence ceiling (~3.2/s,
        // motion law 10) lets feet lightly skate at sprint instead of
        // blur-cycling. Scroll-driven travel still animates under
        // reduced-motion (narrative); only Idle's ambient loop freezes.
        const dx = studio.lastWx == null ? 0 : Math.abs(pr.root[0] - studio.lastWx);
        studio.lastWx = pr.root[0];
        const spd = dx / Math.max(dt, 1e-6);
        studio.walkCyc += Math.min(spd / studio.strideWalk, 3.2) * dt;
        studio.galCyc += Math.min(spd / studio.strideGallop, 3.2) * dt;
        const wd = studio.walk.getClip().duration;
        studio.walk.time = (studio.walkCyc % 1) * wd;
        if (studio.gallop) {
          const gd = studio.gallop.getClip().duration;
          studio.gallop.time = (studio.galCyc % 1) * gd;
        }
        const idleDur = studio.idle.getClip().duration;
        studio.idle.time = runtime.reduce ? 0.4 : frame.t % idleDur;
        // engagement: a moving fox is fully IN its gait (loco saturates fast —
        // the procedural `run` ease under-weights clips and left the fox half
        // idle while clearly travelling). Walk's short stride only stays
        // under the cadence ceiling at a crawl — beyond that a real fox
        // gallops, and so does this one.
        const loco = clamp(frame.speed / 0.02, 0, 1);
        // NARROW walk→gallop band: blending two locomotion clips of different
        // frequency cannot foot-lock (each smears the other), so the blend
        // zone is a brief transition, never a steady state
        const gal = studio.gallop ? clamp((frame.speed - 0.012) / 0.006, 0, 1) : 0;
        studio.walk.weight = loco * (1 - gal);
        if (studio.gallop) studio.gallop.weight = loco * gal;
        studio.idle.weight = 1 - loco;
        studio.mixer.update(0);                     // evaluate at the set times
        if (!studio.calibrated) {
          // one-time self-calibration from the SKINNED world bounds: scale
          // to the procedural fox's height, then plant the feet on the root.
          // Box3.setFromObject does NOT refresh ANCESTOR matrices — without
          // the explicit updateMatrixWorld the fox group's same-frame move
          // is unseen and the fox grounds 0.5 units too high (measured bug)
          fox.updateMatrixWorld(true);
          const bb = new THREE.Box3().setFromObject(studio.wrap);
          const h = bb.max.y - bb.min.y;
          if (h > 1e-3) {
            studio.wrap.scale.multiplyScalar(studio.targetH / h);
            fox.updateMatrixWorld(true);
            const bb2 = new THREE.Box3().setFromObject(studio.wrap);
            studio.wrap.position.y -= (bb2.min.y - pr.root[1]) / fox.scale.y;
            // auto-measure each clip's baked stride (foot-effector x-span
            // over one cycle, world units) so foot-lock never hardcodes a
            // magic number for a particular GLB
            let footBone = null;
            studio.wrap.traverse((o) => { if (!footBone && o.isBone && /^FF[LR]?$/.test(o.name)) footBone = o; });
            if (footBone) {
              const fv = new THREE.Vector3();
              const sweep = (action) => {
                const dur = action.getClip().duration, xs = [];
                const w = [studio.walk.weight, studio.idle.weight, studio.gallop && studio.gallop.weight];
                studio.walk.weight = 0; studio.idle.weight = 0; if (studio.gallop) studio.gallop.weight = 0;
                action.weight = 1;
                for (let i = 0; i < 24; i++) {
                  action.time = (i / 24) * dur;
                  studio.mixer.update(0);
                  studio.wrap.updateMatrixWorld(true);
                  footBone.getWorldPosition(fv);
                  xs.push(fv.x);
                }
                action.weight = 0;
                studio.walk.weight = w[0]; studio.idle.weight = w[1]; if (studio.gallop) studio.gallop.weight = w[2];
                return Math.max(...xs) - Math.min(...xs);
              };
              const sw = sweep(studio.walk);
              if (sw > 0.05) studio.strideWalk = sw;
              if (studio.gallop) {
                const sg = sweep(studio.gallop);
                if (sg > 0.05) studio.strideGallop = sg;
              }
            }
            studio.calibrated = true;
          }
        }
      } else {
        // limbs from the shared anatomy point chains
        for (const key of ["hindNear", "foreNear", "hindFar", "foreFar"]) {
          const chain = pose.limbs[key];
          const z = (key.endsWith("Near") ? 1 : -1) * pose.stanceZ;
          for (let i = 0; i < 3; i++) {
            const a = chain.points[i], b = chain.points[i + 1];
            placeBone(boneMeshes[key + i], a.x, a.y, z, b.x, b.y, z);
          }
        }
        const bodyY = pose.fam.shoulderHeight + pose.bob + 0.06;
        body.position.set(0, bodyY, 0);
        body.scale.set(1.42 * (1 + pose.breath), 0.62, 0.56 * (1 + pose.breath));
        saddle.position.set(-0.1, bodyY + 0.12, 0);   // dark saddle rides high on the back
        chest.position.set(0.52, bodyY - 0.12, 0);
        haunch.position.set(-0.52, bodyY + 0.02, 0);
        placeBone(neck, 0.48, bodyY - 0.02, 0, pose.headC.x - 0.04, pose.headC.y + 0.04, 0);
        head.position.set(pose.headC.x, pose.headC.y + 0.1, 0);
        head.rotation.z = pose.bob * 0.4;
        head.rotation.y = pr.gaze[0] * 0.4;
        head.rotation.x = pr.gaze[1] * 0.25;
        const blinkS = pr.blink > 0 ? 0.12 : 1;
        for (const e of eyes) e.scale.y = blinkS;
        for (let i = 0; i < 4; i++) {
          const a = pose.tail[i], b = pose.tail[i + 1];
          placeBone(tailBones[i], a.x, a.y, 0.02, b.x, b.y, 0.02);
        }
      }
      contact.position.set(pr.root[0], pr.root[1] + 0.02, 0);
      // the PCF map already draws the shadow SHAPE — the contact blob only
      // grounds the core; at 0.55 it doubled into a second dark blob under
      // low sun (user-reported "shadows poor")
      contact.material.opacity = LOOK.lighting.shadowDarkness * 0.22;

      // follow-frustum moon shadow (§3.1): light + target track the fox
      moonTarget.position.set(pr.root[0], pr.root[1], 0);
      moonDir.position.set(pr.root[0] + kd[0] * 24, pr.root[1] + kd[1] * 24, kd[2] * 24);

      // props: activation drives emissive + halo; light pool goes to nearest lit
      const lit = [];
      for (const fp of frame.props) {
        let view = propViews.get(fp.id);
        if (!view) {
          const mk = FACTORY[fp.type];
          if (!mk) continue;
          view = mk(fp);
          view.group.position.set(fp.x, fp.y, fp.z);
          view.group.scale.setScalar(fp.scale);
          scene.add(view.group);
          propViews.set(fp.id, view);
        }
        if (view.paperMat) {
          view.paperMat.emissiveIntensity = 0.05 + fp.activation * 2.2;
          view.halo.scale.setScalar(0.001 + fp.activation * 2.6 * bloomHaloMul);
          view.halo.material.opacity = fp.activation * 0.85;
          if (fp.activation > 0.05) lit.push({ fp, view });
        }
      }
      lit.sort((a, b) => Math.abs(a.fp.x - pr.root[0]) - Math.abs(b.fp.x - pr.root[0]));
      pool.forEach((l, i) => {
        const e = lit[i];
        if (e) {
          l.intensity = 3.2 * e.fp.activation;
          l.position.set(e.fp.x + e.view.lightAnchor.x * e.fp.scale, e.fp.y + e.view.lightAnchor.y * e.fp.scale, e.fp.z);
        } else l.intensity = 0;
      });

      // petals
      petalPool.forEach((m, i) => {
        const q = frame.particles.petals[i];
        if (!q) { m.visible = false; return; }
        m.visible = true;
        m.position.set(q.x, q.y, q.z);
        m.rotation.set(q.rot, q.rot * 0.7, q.rot * 1.3);
        m.material.opacity = clamp(q.life * 2, 0, 0.95);
      });
      // fireflies pulse
      flySprites.forEach((s, i) => {
        const f = frame.particles.flies[i];
        const pulse = runtime.reduce ? 0.7 : 0.4 + 0.6 * Math.abs(Math.sin(frame.t * 2.2 + f.ph));
        s.position.set(f.x, runtime.groundAt(f.x) + f.y + (runtime.reduce ? 0 : Math.sin(frame.t + f.ph) * 0.2), f.z);
        s.material.opacity = pulse * 0.9;
      });

      // aurora shimmer — ambient motion, KILLED under reduced-motion (§2.3);
      // null on worlds without the aurora roles
      if (auroraMat && !runtime.reduce) {
        auroraTex.offset.x = frame.t * 0.012;
        auroraMat.opacity = 0.82 + 0.16 * Math.sin(frame.t * 0.55);
      }

      // sky far-parallax + camera from the Frame's dolly rail
      skyGroup.position.x = frame.camera.pos[0] * 0.92;
      camera.position.set(frame.camera.pos[0], frame.camera.pos[1], frame.camera.pos[2]);
      camera.lookAt(frame.camera.lookAt[0], frame.camera.lookAt[1], frame.camera.lookAt[2]);
      camera.fov = frame.camera.fov * LOOK.camera.fovMul;
      camera.updateProjectionMatrix();

      if (post.active && post.dofPass.enabled) post.dof.target.set(pr.root[0], pr.root[1] + 0.5, 0);
      if (post.active && (post.pass.enabled || post.dofPass.enabled)) {
        post.composer.render(dt);
      } else {
        // the composer sets renderer.autoClear=false and leaves it — the
        // plain path MUST restore it or frames ghost-accumulate (blocky
        // stale-buffer artifacts, found via graded framebuffer capture)
        renderer.autoClear = true;
        renderer.render(scene, camera);
      }
      if (!lookSynced) {
        // props/particles materialize during the FIRST render — re-apply the
        // look once so a toon initial look reaches lazily-created meshes
        lookSynced = true;
        setLook(LOOK);
      }
    }

    function resize(w, h, dpr) {
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(dpr, 2));
      if (post.composer) post.composer.setSize(w, h);   // a resized composer re-allocates its RTs
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    return {
      render, resize, setLook,
      dispose() { if (post.composer) post.composer.dispose(); renderer.dispose(); if (window.WorldGrade) window.WorldGrade.clear(canvas); },
      capabilities: { shadows: true, volumetric: false, dof: false, pointLights: POOL },
      _debug: { scene, camera, renderer, fox, studio, post, propTypes: Object.keys(FACTORY) },
    };
  }

  window.ThreeWorldAdapter = ThreeWorldAdapter;
})();

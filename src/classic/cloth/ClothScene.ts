import * as THREE from 'three';

/**
 * The résumé, hung on a line by two clips. It's a verlet sheet: a grid of
 * points that remember where they were last frame, held together by links
 * (straight, diagonal, and every-other-point links that make it stiff like
 * paper instead of floppy like cloth). Pull it down past the line and it lets
 * go; the page opens the PDF. It only simulates while something is moving.
 */

export interface ClothCallbacks {
  /** the sheet was pulled far enough to come off its clips */
  onPulled: () => void;
  /** how far the grabbed point is pulled, 0 (resting) to 1 (comes off) */
  onTension: (k: number) => void;
}

const COLS = 13;
const ROWS = 17;
const SHEET_W = 3;
const SHEET_H = SHEET_W * (792 / 612); // US letter
const PIN_COLS = [2, COLS - 3];
const GRAVITY = -9.5;
const DAMP = 0.985;
const ITER = 14;
const PULL_TO_OPEN = 1.25; // world units below the grabbed point's resting place

interface Link {
  a: number;
  b: number;
  rest: number;
  stiff: number;
}

export class ClothScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  private geo: THREE.PlaneGeometry;
  private mesh: THREE.Mesh;
  private clips: THREE.Mesh[] = [];
  private pos: Float32Array;
  private prev: Float32Array;
  private rest: Float32Array;
  private links: Link[] = [];
  private pinned = new Set<number>();
  private grab: { i: number; target: THREE.Vector3; restY: number } | null = null;
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private raf = 0;
  private last = 0;
  private visible = false;
  private awakeUntil = 0;
  private falling = false;
  private wind = 0;
  private disposed = false;
  private rehangTimer = 0;
  // coming back to the tab (the PDF opens in a new one) picks the motion back up
  private onVisible = () => {
    if (!document.hidden) {
      this.last = 0;
      this.schedule();
    }
  };

  constructor(
    private canvas: HTMLCanvasElement,
    page: string,
    private cb: ClothCallbacks,
    private reduced: boolean,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera.position.set(0, -0.25, 9.2);
    this.camera.lookAt(0, -0.25, 0);

    this.scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a20, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-3, 4, 6);
    this.scene.add(key);

    // the sheet
    this.geo = new THREE.PlaneGeometry(SHEET_W, SHEET_H, COLS - 1, ROWS - 1);
    const tex = new THREE.TextureLoader().load(page, () => this.wake(400));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.scene.add(this.mesh);

    // the line and the two clips that hold the top edge
    const top = SHEET_H / 2;
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 7, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.5, metalness: 0.4 }),
    );
    wire.rotation.z = Math.PI / 2;
    wire.position.set(0, top + 0.06, -0.02);
    this.scene.add(wire);
    const clipMat = new THREE.MeshStandardMaterial({ color: 0x1b1612, roughness: 0.35, metalness: 0.6 });
    for (const c of PIN_COLS) {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.08), clipMat);
      const x = -SHEET_W / 2 + (c / (COLS - 1)) * SHEET_W;
      clip.position.set(x, top + 0.02, 0.05);
      this.clips.push(clip);
      this.scene.add(clip);
    }

    // the points, starting flat and hanging straight down
    const n = COLS * ROWS;
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    this.rest = new Float32Array(n * 3);
    const attr = this.geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      this.rest[i * 3] = attr.getX(i);
      this.rest[i * 3 + 1] = attr.getY(i);
      this.rest[i * 3 + 2] = 0;
    }
    this.pos.set(this.rest);
    this.prev.set(this.rest);
    PIN_COLS.forEach((c) => this.pinned.add(c));

    const idx = (r: number, c: number) => r * COLS + c;
    const link = (a: number, b: number, stiff: number) => {
      const dx = this.rest[a * 3] - this.rest[b * 3];
      const dy = this.rest[a * 3 + 1] - this.rest[b * 3 + 1];
      this.links.push({ a, b, rest: Math.hypot(dx, dy), stiff });
    };
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (c < COLS - 1) link(idx(r, c), idx(r, c + 1), 1);
        if (r < ROWS - 1) link(idx(r, c), idx(r + 1, c), 1);
        if (c < COLS - 1 && r < ROWS - 1) {
          link(idx(r, c), idx(r + 1, c + 1), 0.6);
          link(idx(r, c + 1), idx(r + 1, c), 0.6);
        }
        // paper: links that skip a point resist bending
        if (c < COLS - 2) link(idx(r, c), idx(r, c + 2), 0.35);
        if (r < ROWS - 2) link(idx(r, c), idx(r + 2, c), 0.35);
      }

    // a gentle first sway so it reads as hanging, not printed
    for (let i = 0; i < n; i++) this.prev[i * 3 + 2] = this.pos[i * 3 + 2] - 0.012 * (this.rest[i * 3 + 1] < 0 ? 1 : 0.3);
    this.writeGeometry();
    document.addEventListener('visibilitychange', this.onVisible);
  }

  /** Keep simulating for at least `ms` more. */
  private wake(ms = 1200) {
    this.awakeUntil = Math.max(this.awakeUntil, performance.now() + ms);
    this.schedule();
  }

  private schedule() {
    if (!this.raf && this.visible && !this.disposed && !document.hidden) this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    const dt = this.last ? Math.min(1 / 30, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    if (!this.reduced) this.step(dt);
    this.writeGeometry();
    this.renderer.render(this.scene, this.camera);
    if (this.grab || this.falling || now < this.awakeUntil) this.schedule();
    else this.last = 0;
  };

  private step(dt: number) {
    const n = COLS * ROWS;
    const g = GRAVITY * dt * dt;
    this.wind += dt;
    const breeze = Math.sin(this.wind * 1.3) * 0.0009 + Math.sin(this.wind * 3.1) * 0.0004;
    for (let i = 0; i < n; i++) {
      if (this.pinned.has(i) && !this.falling) continue;
      const k = i * 3;
      const x = this.pos[k];
      const y = this.pos[k + 1];
      const z = this.pos[k + 2];
      const row = Math.floor(i / COLS) / (ROWS - 1);
      this.pos[k] += (x - this.prev[k]) * DAMP;
      this.pos[k + 1] += (y - this.prev[k + 1]) * DAMP + g;
      this.pos[k + 2] += (z - this.prev[k + 2]) * DAMP + breeze * row;
      this.prev[k] = x;
      this.prev[k + 1] = y;
      this.prev[k + 2] = z;
    }
    if (this.grab) {
      const k = this.grab.i * 3;
      // the hand leads; the point follows quickly but not rigidly
      this.pos[k] += (this.grab.target.x - this.pos[k]) * 0.5;
      this.pos[k + 1] += (this.grab.target.y - this.pos[k + 1]) * 0.5;
      this.pos[k + 2] += (this.grab.target.z + 0.25 - this.pos[k + 2]) * 0.5;
    }
    for (let it = 0; it < ITER; it++) {
      for (const l of this.links) {
        const a = l.a * 3;
        const b = l.b * 3;
        const dx = this.pos[b] - this.pos[a];
        const dy = this.pos[b + 1] - this.pos[a + 1];
        const dz = this.pos[b + 2] - this.pos[a + 2];
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = ((d - l.rest) / d) * 0.5 * l.stiff;
        const pa = this.pinned.has(l.a) && !this.falling;
        const pb = this.pinned.has(l.b) && !this.falling;
        const ga = this.grab?.i === l.a;
        const gb = this.grab?.i === l.b;
        const wa = pa || ga ? 0 : pb || gb ? 2 : 1;
        const wb = pb || gb ? 0 : pa || ga ? 2 : 1;
        this.pos[a] += dx * diff * wa;
        this.pos[a + 1] += dy * diff * wa;
        this.pos[a + 2] += dz * diff * wa;
        this.pos[b] -= dx * diff * wb;
        this.pos[b + 1] -= dy * diff * wb;
        this.pos[b + 2] -= dz * diff * wb;
      }
      // the wall behind it: the sheet can't swing into the line
      for (let i = 0; i < n; i++) if (this.pos[i * 3 + 2] < -0.6) this.pos[i * 3 + 2] = -0.6;
    }
    if (this.grab) {
      const pulled = this.grab.restY - this.pos[this.grab.i * 3 + 1];
      const k = Math.max(0, Math.min(1, pulled / PULL_TO_OPEN));
      // at full stretch it holds; letting go is what opens the PDF (it has to come from the hand)
      this.cb.onTension(k);
    }
    // a dropped sheet that has fallen out of view hangs itself back up
    if (this.falling && this.pos[1] < -SHEET_H * 2.6) this.rehang();
  }

  private writeGeometry() {
    const attr = this.geo.attributes.position as THREE.BufferAttribute;
    (attr.array as Float32Array).set(this.pos);
    attr.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.clips.forEach((clip) => (clip.visible = !this.falling));
  }

  private toWorld(clientX: number, clientY: number, z = 0) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.plane.constant = -z;
    const out = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.plane, out) ? out : null;
  }

  /** Pointer down: grab the nearest point of the sheet, if the pointer is on it. */
  grabAt(clientX: number, clientY: number): boolean {
    if (this.falling) return false;
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.mesh)[0];
    if (!hit) return false;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < COLS * ROWS; i++) {
      if (this.pinned.has(i)) continue;
      const d = Math.hypot(this.pos[i * 3] - hit.point.x, this.pos[i * 3 + 1] - hit.point.y, this.pos[i * 3 + 2] - hit.point.z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return false;
    this.grab = { i: best, target: hit.point.clone(), restY: this.rest[best * 3 + 1] };
    this.wake();
    return true;
  }

  moveTo(clientX: number, clientY: number) {
    if (!this.grab) return;
    const p = this.toWorld(clientX, clientY, this.pos[this.grab.i * 3 + 2]);
    if (p) this.grab.target.copy(p);
    this.wake();
  }

  /** Let go. Past the pull line the sheet comes off its clips. */
  release(pulledOff = false) {
    if (!this.grab) return;
    const pulled = this.grab.restY - this.pos[this.grab.i * 3 + 1];
    this.grab = null;
    this.cb.onTension(0);
    if (pulledOff || pulled >= PULL_TO_OPEN) this.drop();
    else this.wake(2400);
  }

  /** Brush past it: a little push where the pointer crosses. */
  brush(clientX: number, clientY: number, dx: number) {
    if (this.grab || this.falling || this.reduced) return;
    const p = this.toWorld(clientX, clientY);
    if (!p) return;
    for (let i = 0; i < COLS * ROWS; i++) {
      const k = i * 3;
      const d = Math.hypot(this.pos[k] - p.x, this.pos[k + 1] - p.y);
      if (d < 0.7) this.prev[k + 2] -= (0.7 - d) * Math.sign(dx || 1) * 0.004;
    }
    this.wake(1600);
  }

  /** The button twin, and the end of a pull: off the clips, down and away. */
  drop() {
    if (this.falling) return;
    this.grab = null;
    this.cb.onTension(0);
    this.cb.onPulled();
    if (this.reduced) return;
    this.falling = true;
    this.wake();
    // it always comes back, even if the fall was paused in a background tab
    window.clearTimeout(this.rehangTimer);
    this.rehangTimer = window.setTimeout(() => {
      if (this.falling) {
        this.rehang();
        this.writeGeometry();
        this.renderer.render(this.scene, this.camera);
      }
    }, 1800);
  }

  private rehang() {
    window.clearTimeout(this.rehangTimer);
    this.falling = false;
    this.pos.set(this.rest);
    this.prev.set(this.rest);
    // it comes back from just above, settling onto the clips
    for (let i = 0; i < COLS * ROWS; i++) this.prev[i * 3 + 2] = -0.03;
    this.wake(1800);
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) {
      this.last = 0;
      this.renderer.render(this.scene, this.camera);
      this.wake(this.reduced ? 0 : 1600);
    }
  }

  resize(w: number, h: number) {
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // keep the whole sheet in frame on narrow boxes
    const fitH = SHEET_H * 1.32;
    const fitW = (SHEET_W * 1.5) / this.camera.aspect;
    const span = Math.max(fitH, fitW);
    this.camera.position.z = span / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    window.clearTimeout(this.rehangTimer);
    document.removeEventListener('visibilitychange', this.onVisible);
    cancelAnimationFrame(this.raf);
    this.geo.dispose();
    const mat = this.mesh.material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.dispose();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o !== this.mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

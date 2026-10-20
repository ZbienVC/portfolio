import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import type { Unit } from '../lib/data';

/**
 * The Stack: every live site is one block, stacked in the order it first went
 * live (oldest at the bottom), so the tower's height is the count and its
 * order is the timeline. It stands in a shallow tray on ledger paper. Knock it
 * over, throw blocks around, click one to open it, stack it back.
 *
 * three.js draws, cannon-es does the physics. The scene only steps and draws
 * while something is moving or the pointer is on it, and never while it's off
 * screen.
 */

export interface SceneColors {
  paper: string;
  paper2: string;
  paper3: string;
  ink: string;
  ink3: string;
  rule: string;
  amber: string;
}

export interface StackCallbacks {
  /** the block under the pointer, and where its top centre sits on screen (CSS px in the canvas) */
  onHover: (unit: Unit | null, at: { x: number; y: number } | null) => void;
  onPick: (unit: Unit) => void;
  /** true when the tower is standing in order, false once it's been knocked about */
  onStanding: (standing: boolean) => void;
  /** month ticks up the tower's side (only while standing): label and screen y */
  onTicks: (ticks: { label: string; x: number; y: number }[]) => void;
}

const BLOCK = { w: 2.3, h: 0.44, d: 1.05 };
const TRAY = { w: 10.5, d: 7, wall: 0.55, thick: 0.3 };
const GAP = 0.004;

interface Block {
  unit: Unit;
  body: CANNON.Body;
  mesh: THREE.Mesh;
  slot: { pos: CANNON.Vec3; quat: CANNON.Quaternion };
  match: boolean;
}

type Tween = { start: number; dur: number; from: { pos: CANNON.Vec3; quat: CANNON.Quaternion }[]; drop?: boolean };

/** Turn any CSS colour (oklch included) into something three.js understands. */
function cssToColor(css: string): THREE.Color {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillStyle = css;
  g.fillRect(0, 0, 1, 1);
  const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, gg / 255, b / 255, THREE.SRGBColorSpace);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthOf = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
};

export class StackScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  private world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
  private blocks: Block[] = [];
  private trayMeshes: THREE.Mesh[] = [];
  private floorMat = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  private wallMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private hovered: Block | null = null;
  private drag: { block: Block; constraint: CANNON.PointToPointConstraint; plane: THREE.Plane; downAt: { x: number; y: number; t: number }; moved: boolean } | null = null;
  private jointBody = new CANNON.Body({ mass: 0 });
  private raf = 0;
  private visible = false;
  private tween: Tween | null = null;
  private standing = true;
  private dirty = true;
  private quietFrames = 0;
  private w = 1;
  private h = 1;
  private lastTicksKey = '';

  constructor(
    private canvas: HTMLCanvasElement,
    private units: Unit[],
    private colors: SceneColors,
    private cb: StackCallbacks,
    private reduced: boolean,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.buildLights();
    this.buildTray();
    this.buildBlocks();
    this.applyColors();

    this.world.allowSleep = true;
    (this.world.solver as CANNON.GSSolver).iterations = 24;
    this.world.defaultContactMaterial.friction = 0.55;
    this.world.defaultContactMaterial.restitution = 0.04;
    this.jointBody.collisionFilterGroup = 0;
    this.jointBody.collisionFilterMask = 0;
    this.world.addBody(this.jointBody);

    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onCancel);
    canvas.addEventListener('pointerleave', this.onLeave);
  }

  /* ── building ─────────────────────────────────────────────────────────── */

  private buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xfff6ec, 0x8a7a6a, 1.15));
    const sun = new THREE.DirectionalLight(0xffefdc, 2.1);
    sun.position.set(-6, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = sun.shadow.camera as THREE.OrthographicCamera;
    s.left = -10;
    s.right = 10;
    s.top = 12;
    s.bottom = -6;
    s.near = 1;
    s.far = 40;
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 4;
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xffd7a8, 0.5);
    rim.position.set(8, 6, -6);
    this.scene.add(rim);
  }

  private buildTray() {
    // the floor: ledger paper with faint rules
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(TRAY.w, TRAY.d), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.trayMeshes.push(floor);
    const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(ground);

    // four low walls keep everything on the table
    const { w, d, wall, thick } = TRAY;
    const walls: [number, number, number, number][] = [
      [0, -d / 2 - thick / 2, w + thick * 2, thick],
      [0, d / 2 + thick / 2, w + thick * 2, thick],
      [-w / 2 - thick / 2, 0, thick, d],
      [w / 2 + thick / 2, 0, thick, d],
    ];
    for (const [x, z, sx, sz] of walls) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, wall, sz), this.wallMat);
      m.position.set(x, wall / 2, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      this.trayMeshes.push(m);
      const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(sx / 2, 4, sz / 2)) });
      b.position.set(x, 4, z);
      this.world.addBody(b);
    }
  }

  private slotFor(i: number) {
    // hand-stacked: each block a touch off square, the way a real stack sits
    const jitter = Math.sin(i * 12.9898) * 0.5;
    const pos = new CANNON.Vec3(-2.6 + jitter * 0.05, BLOCK.h / 2 + i * (BLOCK.h + GAP), 0.4 + jitter * 0.04);
    const quat = new CANNON.Quaternion().setFromEuler(0, jitter * 0.07, 0);
    return { pos, quat };
  }

  private buildBlocks() {
    const geo = new THREE.BoxGeometry(BLOCK.w, BLOCK.h, BLOCK.d);
    const shape = new CANNON.Box(new CANNON.Vec3(BLOCK.w / 2, BLOCK.h / 2, BLOCK.d / 2));
    this.units.forEach((unit, i) => {
      const slot = this.slotFor(i);
      const body = new CANNON.Body({ mass: 1, shape, allowSleep: true, sleepSpeedLimit: 0.12, sleepTimeLimit: 0.4, linearDamping: 0.06, angularDamping: 0.12 });
      body.position.copy(slot.pos);
      body.quaternion.copy(slot.quat);
      body.sleep();
      this.world.addBody(body);
      const mesh = new THREE.Mesh(geo, []);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.index = i;
      this.scene.add(mesh);
      this.blocks.push({ unit, body, mesh, slot, match: true });
    });
  }

  /** The block's label face: its name in ink, the month it went live in mono. */
  private faceTexture(unit: Unit, base: THREE.Color, side: 'front' | 'top') {
    const W = side === 'front' ? 512 : 512;
    const H = side === 'front' ? Math.round((512 * BLOCK.h) / BLOCK.w) : Math.round((512 * BLOCK.d) / BLOCK.w);
    const c = document.createElement('canvas');
    c.width = W * 2;
    c.height = H * 2;
    const g = c.getContext('2d')!;
    g.scale(2, 2);
    g.fillStyle = `#${base.getHexString(THREE.SRGBColorSpace)}`;
    g.fillRect(0, 0, W, H);
    // a fine paper grain so the faces don't read as flat plastic
    for (let k = 0; k < 260; k++) {
      g.fillStyle = `rgba(60,40,20,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2);
    }
    if (side === 'front') {
      const pad = H * 0.42;
      const month = monthOf(unit.launched);
      g.textBaseline = 'middle';
      g.font = `500 ${Math.round(H * 0.3)}px "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace`;
      const monthW = g.measureText(month).width;
      // the name gets what the month leaves; long names step the size down rather than squeezing
      // (a squeezed "$" reads as an "S")
      const room = W - pad * 2 - monthW - H * 0.35;
      let size = Math.round(H * 0.46);
      const nameFont = (px: number) => `640 ${px}px "Mona Sans Variable", "Mona Sans", system-ui, sans-serif`;
      // a token's "$" is set in the mono face, where its stroke stays clear at block size
      const ticker = unit.name.startsWith('$');
      const word = ticker ? unit.name.slice(1) : unit.name;
      const monoFont = (px: number) => `600 ${px}px "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace`;
      const widthAt = (px: number) => {
        g.font = monoFont(px);
        const lead = ticker ? g.measureText('$').width + px * 0.06 : 0;
        g.font = nameFont(px);
        return lead + g.measureText(word).width;
      };
      while (size > H * 0.3 && widthAt(size) > room) size--;
      g.fillStyle = this.colors.ink;
      let x = pad;
      if (ticker) {
        g.font = monoFont(size);
        g.fillText('$', x, H * 0.53);
        x += g.measureText('$').width + size * 0.06;
      }
      g.font = nameFont(size);
      g.fillText(word, x, H * 0.53, room - (x - pad));
      g.font = `500 ${Math.round(H * 0.3)}px "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace`;
      g.textAlign = 'right';
      g.globalAlpha = 0.62;
      g.fillText(month, W - pad, H * 0.55);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  private applyColors() {
    const paper2 = cssToColor(this.colors.paper2);
    const paper3 = cssToColor(this.colors.paper3);
    this.floorMat.color = paper2;
    this.wallMat.color = paper3;
    // ruled lines on the floor, like the site's ledger paper
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 584;
    const g = c.getContext('2d')!;
    g.fillStyle = `#${paper2.getHexString(THREE.SRGBColorSpace)}`;
    g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = this.colors.rule;
    g.lineWidth = 2;
    for (let y = 36; y < c.height; y += 36) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(c.width, y);
      g.stroke();
    }
    g.strokeStyle = this.colors.amber;
    g.globalAlpha = 0.5;
    g.beginPath();
    g.moveTo(120, 0);
    g.lineTo(120, c.height);
    g.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    this.floorMat.map?.dispose();
    this.floorMat.map = t;
    this.floorMat.color = new THREE.Color(0xffffff);
    this.floorMat.needsUpdate = true;

    for (const b of this.blocks) {
      const base = cssToColor(b.unit.color);
      const plain = new THREE.MeshStandardMaterial({ color: base, roughness: 0.62, metalness: 0.02 });
      const front = new THREE.MeshStandardMaterial({ map: this.faceTexture(b.unit, base, 'front'), roughness: 0.6 });
      const old = b.mesh.material as THREE.Material[];
      old.forEach((m) => {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      });
      // box face order: +x, -x, +y, -y, +z (toward the camera), -z
      b.mesh.material = [plain, plain.clone(), plain.clone(), plain.clone(), front, plain.clone()];
      this.paintMatch(b);
    }
    this.dirty = true;
  }

  setColors(colors: SceneColors) {
    this.colors = colors;
    this.applyColors();
    this.wake();
  }

  /* ── camera ───────────────────────────────────────────────────────────── */

  resize(w: number, h: number) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    // frame the tray's width and the tower's height, whichever needs the camera further back
    const towerH = this.units.length * (BLOCK.h + GAP) + 0.6;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    const needV = (towerH * 0.62) / Math.tan(vFov / 2);
    const needH = (TRAY.w * 0.58) / Math.tan(hFov / 2);
    const dist = Math.max(needV, needH) * 1.04;
    const dir = new THREE.Vector3(0.28, 0.42, 1).normalize();
    const target = new THREE.Vector3(0, towerH * 0.4, 0);
    this.camera.position.copy(target).addScaledVector(dir, dist);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.kick();
  }

  /* ── state ────────────────────────────────────────────────────────────── */

  setVisible(v: boolean) {
    this.visible = v;
    if (v) this.kick();
  }

  setFilter(match: ((u: Unit) => boolean) | null) {
    for (const b of this.blocks) {
      b.match = match ? match(b.unit) : true;
      this.paintMatch(b);
    }
    this.dirty = true;
    this.kick();
  }

  private paintMatch(b: Block) {
    for (const m of b.mesh.material as THREE.MeshStandardMaterial[]) {
      m.transparent = !b.match;
      m.opacity = b.match ? 1 : 0.16;
      m.depthWrite = b.match;
      m.emissive = new THREE.Color(b === this.hovered ? 0x3a2410 : 0x000000);
      m.needsUpdate = true;
    }
  }

  /** The blocks drop into their places one by one, oldest first. */
  playEntrance() {
    if (this.reduced) return;
    this.startTween(true);
  }

  knock() {
    this.tween = null;
    const pick = this.blocks[Math.floor(this.blocks.length * 0.62)];
    if (!pick) return;
    for (const b of this.blocks) {
      b.body.type = CANNON.Body.DYNAMIC;
      b.body.wakeUp();
    }
    if (this.reduced) {
      // no motion: lay them out on the tray floor at once
      this.blocks.forEach((b, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        b.body.position.set(-3.6 + col * 2.5, BLOCK.h / 2, -2.6 + row * 1.25);
        b.body.quaternion.setFromEuler(0, (Math.sin(i) * 0.3), 0);
        b.body.velocity.setZero();
        b.body.angularVelocity.setZero();
        b.body.sleep();
      });
    } else {
      pick.body.applyImpulse(new CANNON.Vec3(9, 1.5, -2.5), new CANNON.Vec3(pick.body.position.x - BLOCK.w / 2, pick.body.position.y, pick.body.position.z));
    }
    this.setStanding(false);
    this.dirty = true;
    this.kick();
  }

  restack() {
    this.startTween(false);
  }

  private startTween(drop: boolean) {
    const from = this.blocks.map((b) => ({
      pos: drop ? new CANNON.Vec3(b.slot.pos.x, b.slot.pos.y + 3.2, b.slot.pos.z) : b.body.position.clone(),
      quat: drop ? b.slot.quat.clone() : b.body.quaternion.clone(),
    }));
    for (const b of this.blocks) {
      b.body.type = CANNON.Body.KINEMATIC;
      b.body.velocity.setZero();
      b.body.angularVelocity.setZero();
    }
    this.tween = { start: performance.now(), dur: this.reduced ? 1 : drop ? 650 : 1100, from, drop };
    if (drop) this.blocks.forEach((b, i) => b.body.position.copy(from[i].pos));
    this.kick();
  }

  private stepTween(now: number) {
    const tw = this.tween!;
    const stagger = tw.drop ? 26 : 32;
    let done = true;
    this.blocks.forEach((b, i) => {
      const t0 = tw.start + i * stagger;
      const k = Math.min(1, Math.max(0, (now - t0) / (tw.dur - stagger * 0.4)));
      if (k < 1) done = false;
      // ease out with a short settle; drops land like they have weight
      const e = tw.drop ? 1 - Math.pow(1 - k, 3) : k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const f = tw.from[i];
      // a restack lifts each block clear of the others before it travels home
      const lift = tw.drop ? 0 : Math.sin(Math.PI * e) * 1.4;
      b.body.position.set(
        f.pos.x + (b.slot.pos.x - f.pos.x) * e,
        f.pos.y + (b.slot.pos.y - f.pos.y) * e + lift,
        f.pos.z + (b.slot.pos.z - f.pos.z) * e,
      );
      f.quat.slerp(b.slot.quat, e, b.body.quaternion);
    });
    if (done) {
      this.tween = null;
      for (const b of this.blocks) {
        b.body.position.copy(b.slot.pos);
        b.body.quaternion.copy(b.slot.quat);
        b.body.type = CANNON.Body.DYNAMIC;
        b.body.velocity.setZero();
        b.body.angularVelocity.setZero();
        b.body.sleep();
      }
      this.setStanding(true);
    }
  }

  private setStanding(v: boolean) {
    if (this.standing === v) return;
    this.standing = v;
    this.cb.onStanding(v);
    if (!v) this.cb.onTicks([]);
    this.lastTicksKey = '';
  }

  /* ── pointer ──────────────────────────────────────────────────────────── */

  private hit(e: PointerEvent): { block: Block; point: THREE.Vector3 } | null {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.blocks.filter((b) => b.match).map((b) => b.mesh), false);
    if (!hits.length) return null;
    const block = this.blocks[hits[0].object.userData.index as number];
    return { block, point: hits[0].point };
  }

  private screenOf(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    return { x: ((p.x + 1) / 2) * this.w, y: ((1 - p.y) / 2) * this.h };
  }

  private setHover(b: Block | null) {
    if (this.hovered === b) return;
    const prev = this.hovered;
    this.hovered = b;
    if (prev) this.paintMatch(prev);
    if (b) this.paintMatch(b);
    this.canvas.style.cursor = b ? (this.drag ? 'grabbing' : 'pointer') : '';
    this.reportHover();
    this.dirty = true;
    this.kick();
  }

  private reportHover() {
    const b = this.hovered;
    if (!b) return this.cb.onHover(null, null);
    const top = new THREE.Vector3(b.mesh.position.x, b.mesh.position.y + BLOCK.h / 2 + 0.05, b.mesh.position.z);
    this.cb.onHover(b.unit, this.screenOf(top));
  }

  private onMove = (e: PointerEvent) => {
    if (this.drag) {
      const d = this.drag;
      if (Math.hypot(e.clientX - d.downAt.x, e.clientY - d.downAt.y) > 6) {
        if (!d.moved) {
          d.moved = true;
          this.setStanding(false);
          for (const b of this.blocks) {
            b.body.type = CANNON.Body.DYNAMIC;
            b.body.wakeUp();
          }
        }
      }
      if (d.moved) {
        const r = this.canvas.getBoundingClientRect();
        this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        this.raycaster.setFromCamera(this.ndc, this.camera);
        const p = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(d.plane, p)) {
          p.y = Math.max(p.y, 0.3);
          this.jointBody.position.set(p.x, p.y, p.z);
        }
      }
      this.kick();
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const h = this.hit(e);
    this.setHover(h?.block ?? null);
  };

  private onDown = (e: PointerEvent) => {
    const h = this.hit(e);
    if (!h) return;
    e.preventDefault();
    this.tween = null;
    const { block, point } = h;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()).negate(), point);
    const local = new CANNON.Vec3();
    block.body.pointToLocalFrame(new CANNON.Vec3(point.x, point.y, point.z), local);
    this.jointBody.position.set(point.x, point.y, point.z);
    const constraint = new CANNON.PointToPointConstraint(block.body, local, this.jointBody, new CANNON.Vec3(0, 0, 0), 60);
    this.world.addConstraint(constraint);
    this.drag = { block, constraint, plane, downAt: { x: e.clientX, y: e.clientY, t: performance.now() }, moved: false };
    if (e.pointerType !== 'mouse') this.setHover(block);
  };

  private onUp = () => {
    const d = this.drag;
    if (!d) return;
    this.world.removeConstraint(d.constraint);
    this.drag = null;
    if (!d.moved && performance.now() - d.downAt.t < 450) this.cb.onPick(d.block.unit);
    this.canvas.style.cursor = this.hovered ? 'pointer' : '';
    this.kick();
  };

  // the browser took the gesture (a page scroll): let go without picking
  private onCancel = () => {
    const d = this.drag;
    if (!d) return;
    this.world.removeConstraint(d.constraint);
    this.drag = null;
    this.kick();
  };

  private onLeave = () => {
    if (!this.drag) this.setHover(null);
  };

  /* ── loop ─────────────────────────────────────────────────────────────── */

  private wake() {
    this.dirty = true;
    this.kick();
  }

  private kick() {
    this.quietFrames = 0;
    if (!this.raf && this.visible) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (!this.visible) return;
    let moving = false;
    if (this.tween) {
      this.stepTween(now);
      moving = true;
    }
    const awake = this.blocks.some((b) => b.body.sleepState !== CANNON.Body.SLEEPING && b.body.type === CANNON.Body.DYNAMIC);
    if (awake || this.drag || this.tween) {
      this.world.fixedStep(1 / 60, 3);
      moving = true;
    }
    for (const b of this.blocks) {
      b.mesh.position.set(b.body.position.x, b.body.position.y, b.body.position.z);
      b.mesh.quaternion.set(b.body.quaternion.x, b.body.quaternion.y, b.body.quaternion.z, b.body.quaternion.w);
    }
    if (moving || this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
      if (this.hovered) this.reportHover();
      this.reportTicks();
    }
    // keep going while anything moves; stop a moment after it all settles
    if (moving) this.quietFrames = 0;
    else this.quietFrames++;
    if (this.quietFrames < 20) this.raf = requestAnimationFrame(this.frame);
  };

  /** One tick per month, at the first block that went live that month. */
  private reportTicks() {
    if (!this.standing || this.tween) return;
    const ticks: { label: string; x: number; y: number }[] = [];
    let last = '';
    this.blocks.forEach((b) => {
      const m = monthOf(b.unit.launched);
      if (m === last) return;
      last = m;
      const p = this.screenOf(new THREE.Vector3(b.slot.pos.x - BLOCK.w / 2 - 0.15, b.slot.pos.y, b.slot.pos.z + BLOCK.d / 2));
      ticks.push({ label: m, x: p.x, y: p.y });
    });
    const key = ticks.map((t) => `${t.label}${Math.round(t.x)}${Math.round(t.y)}`).join();
    if (key !== this.lastTicksKey) {
      this.lastTicksKey = key;
      this.cb.onTicks(ticks);
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.visible = false;
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('pointercancel', this.onCancel);
    this.canvas.removeEventListener('pointerleave', this.onLeave);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as THREE.MeshStandardMaterial[];
      mats.forEach((mat) => {
        mat.map?.dispose();
        mat.dispose();
      });
    });
    this.renderer.dispose();
  }
}

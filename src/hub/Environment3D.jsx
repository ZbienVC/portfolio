import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Instances, Instance, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { snowMaps, rockMaps } from './textures.js';

// seeded RNG for deterministic layout
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// cheap smooth value-noise from layered sines (good enough for silhouettes)
const snoise = (x, y) =>
  Math.sin(x * 1.7 + y * 0.8) * 0.5 +
  Math.sin(x * 0.6 - y * 1.3 + 2.1) * 0.3 +
  Math.sin(x * 3.1 + y * 2.2 + 4.7) * 0.2;

function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#070b18') },
          mid: { value: new THREE.Color('#13233e') },
          bot: { value: new THREE.Color('#33465f') },
          horizon: { value: new THREE.Color('#54627e') },
        },
        vertexShader:
          'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'varying vec3 vP; uniform vec3 top,mid,bot,horizon; void main(){ float h = normalize(vP).y; float t = clamp(h*0.5+0.5,0.0,1.0); vec3 c; if(t>0.62){ c = mix(mid, top, (t-0.62)/0.38);} else if(t>0.44){ c = mix(horizon, mid, (t-0.44)/0.18);} else { c = mix(bot, horizon, t/0.44);} gl_FragColor = vec4(c,1.0); }',
      }),
    []
  );
  return (
    <mesh scale={300}>
      <sphereGeometry args={[1, 32, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

// Sculpted mountains — noise-displaced cones with vertex-colored snow line.
// Smooth-shaded so ridges read as terrain, not "geometric shapes".
function Mountain({ x, z, h, w, seed, rot }) {
  const geo = useMemo(() => {
    const R = mulberry32(seed);
    const phase = R() * 10;
    const g = new THREE.ConeGeometry(w, h, 24, 10);
    const pos = g.attributes.position;
    const rock = new THREE.Color('#25314e');
    const rockLo = new THREE.Color('#182238');
    const snow = new THREE.Color('#c9d6ec');
    const snowHi = new THREE.Color('#e8effb');
    const colors = new Float32Array(pos.count * 3);
    const C = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      const yr = py / h + 0.5; // 0 base → 1 peak
      const ang = Math.atan2(pz, px);
      // radial ridge displacement, fading toward the peak
      const n = snoise(ang * 2.2 + phase, yr * 5.5 + phase);
      const k = 1 + n * 0.28 * (1 - yr * 0.75);
      pos.setX(i, px * k);
      pos.setZ(i, pz * k);
      pos.setY(i, py + snoise(ang * 3.5 + phase, 8.0) * h * 0.02);
      // snow above a noisy altitude line; darker rock in the crevices
      const line = 0.42 + snoise(ang * 3.0 + phase, 1.0) * 0.13;
      if (yr > line + 0.1) C.copy(yr > 0.8 ? snowHi : snow);
      else if (yr > line) C.lerpColors(rock, snow, (yr - line) / 0.1);
      else C.lerpColors(rockLo, rock, yr / Math.max(line, 0.001));
      // crevice shading from the same ridge noise
      C.multiplyScalar(0.82 + 0.18 * (n * 0.5 + 0.5));
      colors[i * 3] = C.r; colors[i * 3 + 1] = C.g; colors[i * 3 + 2] = C.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [h, w, seed]);
  return (
    <mesh geometry={geo} position={[x, h / 2 - 2.5, z]} rotation={[0, rot, 0]}>
      <meshStandardMaterial vertexColors roughness={0.96} />
    </mesh>
  );
}

function MountainRange() {
  const peaks = useMemo(() => {
    const R = mulberry32(1337);
    const out = [];
    const rings = [
      { r: 66, n: 11, hmin: 20, hmax: 38 },
      { r: 46, n: 9, hmin: 12, hmax: 22 },
    ];
    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.n; i++) {
        const a = (i / ring.n) * Math.PI * 2 + R() * 0.35 + ri * 0.3;
        const rr = ring.r + (R() - 0.5) * 10;
        const h = ring.hmin + R() * (ring.hmax - ring.hmin);
        out.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, h, w: h * (0.62 + R() * 0.35), seed: 100 + ri * 50 + i, rot: R() * Math.PI });
      }
    });
    return out;
  }, []);
  return <group>{peaks.map((p, i) => <Mountain key={i} {...p} />)}</group>;
}

// Instanced pine forest — 5 draw calls for ~46 trees, each with tonal variation.
const AVOID = [[0, 0], [-2.4, -9.5], [-7.2, -3.5], [7.2, -3.5], [-7.4, 3.2], [7.6, 1.5], [3.4, 6.5]];
function PineForest() {
  const trees = useMemo(() => {
    const R = mulberry32(555);
    const out = [];
    let guard = 0;
    while (out.length < 46 && guard++ < 400) {
      const a = R() * Math.PI * 2;
      const r = 13 + R() * 26;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 12 && Math.abs(x) < 7) continue; // keep the camera corridor clear
      if (AVOID.some(([ax, az]) => Math.hypot(x - ax, z - az) < 4.6)) continue;
      out.push({ x, z, s: 0.75 + R() * 0.85, rot: R() * Math.PI * 2, tone: 0.8 + R() * 0.35 });
    }
    return out;
  }, []);
  const green = new THREE.Color('#2c4a3a');
  const tiers = [
    { args: [1.15, 1.5, 8], y: 1.35 },
    { args: [0.88, 1.3, 8], y: 2.25 },
    { args: [0.58, 1.1, 8], y: 3.1 },
  ];
  return (
    <group>
      {/* trunks */}
      <Instances limit={trees.length} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 1.4, 6]} />
        <meshStandardMaterial color="#241b12" roughness={0.95} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 0.7 * t.s, t.z]} scale={t.s} rotation={[0, t.rot, 0]} />
        ))}
      </Instances>
      {/* needle tiers */}
      {tiers.map((tier, ti) => (
        <Instances key={ti} limit={trees.length} castShadow>
          <coneGeometry args={tier.args} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
          {trees.map((t, i) => (
            <Instance
              key={i}
              position={[t.x, tier.y * t.s, t.z]}
              scale={t.s}
              rotation={[0, t.rot + ti * 0.4, 0]}
              color={green.clone().multiplyScalar(t.tone)}
            />
          ))}
        </Instances>
      ))}
      {/* snow caps */}
      <Instances limit={trees.length}>
        <coneGeometry args={[0.42, 0.55, 8]} />
        <meshStandardMaterial color="#e6edf8" roughness={1} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 3.62 * t.s, t.z]} scale={t.s} rotation={[0, t.rot, 0]} />
        ))}
      </Instances>
    </group>
  );
}

// Terrain — displaced, smooth-shaded, bump-mapped snowfield with wind drifts
// and a packed clearing at the basecamp.
function Ground({ onGroundClick }) {
  const { map, bumpMap } = useMemo(() => snowMaps(), []);
  map.repeat.set(26, 26);
  bumpMap.repeat.set(26, 26);
  const geo = useMemo(() => {
    const R = mulberry32(99);
    const g = new THREE.PlaneGeometry(150, 150, 150, 150);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const d = Math.hypot(x, y);
      const clearing = THREE.MathUtils.smoothstep(d, 5, 15); // flat at camp, drifts beyond
      const drifts =
        snoise(x * 0.10, y * 0.10) * 0.85 +
        snoise(x * 0.045 + 9, y * 0.045) * 1.4 +
        (R() - 0.5) * 0.06;
      const rim = THREE.MathUtils.smoothstep(d, 34, 62) * 4.5; // rise toward the peaks
      pos.setZ(i, drifts * clearing + rim);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh
      geometry={geo}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onGroundClick?.(e.point);
      }}
    >
      <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.55} color="#cdd8ec" roughness={0.88} />
    </mesh>
  );
}

function Aurora() {
  const tex = useMemo(() => {
    const W = 256, H = 128;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const teal = [95, 214, 196];
    const violet = [120, 150, 255];
    const img = g.createImageData(W, H);
    for (let x = 0; x < W; x++) {
      const fx = x / W;
      const streak = Math.max(0, 0.4 + 0.4 * Math.sin(fx * Math.PI * 6) + 0.2 * Math.sin(fx * Math.PI * 14 + 1.3));
      for (let y = 0; y < H; y++) {
        const ty = y / H;
        const env = Math.sin(ty * Math.PI);
        const idx = (y * W + x) * 4;
        img.data[idx] = violet[0] + (teal[0] - violet[0]) * ty;
        img.data[idx + 1] = violet[1] + (teal[1] - violet[1]) * ty;
        img.data[idx + 2] = violet[2] + (teal[2] - violet[2]) * ty;
        img.data[idx + 3] = Math.round(255 * env * streak * 0.9);
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }, []);
  const m1 = useRef();
  const m2 = useRef();
  useFrame((s) => {
    const e = s.clock.elapsedTime;
    if (m1.current) { m1.current.material.map.offset.x = e * 0.01; m1.current.material.opacity = 0.55 + 0.15 * Math.sin(e * 0.5); }
    if (m2.current) { m2.current.material.map.offset.x = -e * 0.006; m2.current.material.opacity = 0.36 + 0.1 * Math.sin(e * 0.4 + 1); }
  });
  return (
    <group position={[0, 40, -70]} rotation={[-0.45, 0, 0]}>
      <mesh ref={m1}>
        <planeGeometry args={[240, 52]} />
        <meshBasicMaterial map={tex} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={m2} position={[24, 12, -14]}>
        <planeGeometry args={[210, 38]} />
        <meshBasicMaterial map={tex.clone()} transparent opacity={0.36} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// scattered snow boulders — mid-ground detail so the field isn't empty
function Boulders() {
  const rocks = useMemo(() => {
    const R = mulberry32(808);
    const out = [];
    let guard = 0;
    while (out.length < 12 && guard++ < 200) {
      const a = R() * Math.PI * 2;
      const r = 11 + R() * 18;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 10 && Math.abs(x) < 7) continue;
      if (AVOID.some(([ax, az]) => Math.hypot(x - ax, z - az) < 3.6)) continue;
      out.push({ x, z, s: 0.3 + R() * 0.65, rot: R() * Math.PI * 2 });
    }
    return out;
  }, []);
  const { map, bumpMap } = useMemo(() => rockMaps(), []);
  return (
    <group>
      {rocks.map((r, i) => (
        <group key={i} position={[r.x, 0, r.z]} rotation={[0, r.rot, 0]} scale={r.s}>
          <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.62, 1]} />
            <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={0.4} roughness={0.95} />
          </mesh>
          {/* snow settled on top */}
          <mesh position={[0, 0.62, 0]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.5, 12, 8]} />
            <meshStandardMaterial color="#e4ecf8" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Environment3D({ onGroundClick }) {
  return (
    <group>
      <fogExp2 attach="fog" args={['#111c33', 0.016]} />
      <SkyDome />
      <Stars radius={130} depth={40} count={1600} factor={3.2} saturation={0} fade speed={0.4} />
      <Aurora />
      <MountainRange />
      <PineForest />
      <Boulders />
      <Ground onGroundClick={onGroundClick} />

      {/* moon disc + halo */}
      <group position={[-26, 30, -46]}>
        <mesh>
          <sphereGeometry args={[3.0, 24, 24]} />
          <meshBasicMaterial color="#f2f6ff" toneMapped={false} fog={false} />
        </mesh>
        <mesh scale={7}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#aebfe4" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
        </mesh>
      </group>

      {/* lighting rig: cool moon key + warm camp bounce + cold rim + hemi */}
      <directionalLight
        position={[-20, 26, -10]}
        intensity={2.0}
        color="#cfdcfa"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />
      {/* warm counter-light from the camp lanterns (soft, no shadow) */}
      <pointLight position={[0, 3.4, 2]} intensity={14} distance={22} decay={2} color="#ffbe78" />
      {/* cold rim from behind the peaks — separates silhouettes */}
      <directionalLight position={[14, 10, -30]} intensity={0.7} color="#7d96d8" />
      <hemisphereLight args={['#33456b', '#0b1120', 0.55]} />
      <ambientLight intensity={0.14} color="#9fb0d0" />

      {/* PBR reflections without external HDRIs — a tiny authored light studio */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#b7c8f0" position={[0, 6, -9]} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffc888" position={[4, 2, 6]} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#dfe9ff" position={[-8, 8, 4]} scale={4} />
      </Environment>

      {/* falling + drifting snow */}
      <Sparkles count={110} scale={[46, 24, 46]} position={[0, 11, 0]} size={2.6} speed={0.3} opacity={0.55} color="#eef4ff" />
      <Sparkles count={56} scale={[26, 10, 26]} position={[0, 4, 0]} size={4} speed={0.55} opacity={0.42} color="#ffffff" />
      {/* ground glitter */}
      <Sparkles count={64} scale={[30, 0.4, 30]} position={[0, 0.25, 0]} size={1.6} speed={0.06} opacity={0.5} color="#dfe9ff" />
    </group>
  );
}

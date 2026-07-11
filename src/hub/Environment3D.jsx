import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// seeded RNG for deterministic peak layout
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#0a0f1e') },
          mid: { value: new THREE.Color('#152b45') },
          bot: { value: new THREE.Color('#2c3e5e') },
          horizon: { value: new THREE.Color('#4a5a7a') },
        },
        vertexShader:
          'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'varying vec3 vP; uniform vec3 top,mid,bot,horizon; void main(){ float h = normalize(vP).y; float t = clamp(h*0.5+0.5,0.0,1.0); vec3 c; if(t>0.6){ c = mix(mid, top, (t-0.6)/0.4);} else if(t>0.42){ c = mix(horizon, mid, (t-0.42)/0.18);} else { c = mix(bot, horizon, t/0.42);} gl_FragColor = vec4(c,1.0); }',
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

function Peaks() {
  const geos = useMemo(() => {
    const rng = mulberry32(1337);
    const rings = [
      { r: 62, n: 26, hmin: 14, hmax: 30, color: '#141d33' },
      { r: 44, n: 20, hmin: 9, hmax: 20, color: '#1a2540' },
      { r: 30, n: 16, hmin: 5, hmax: 12, color: '#213050' },
    ];
    return rings.map((ring) => {
      const items = [];
      for (let i = 0; i < ring.n; i++) {
        const a = (i / ring.n) * Math.PI * 2 + rng() * 0.2;
        const rr = ring.r + (rng() - 0.5) * 8;
        const h = ring.hmin + rng() * (ring.hmax - ring.hmin);
        const w = h * (0.7 + rng() * 0.5);
        items.push({ x: Math.cos(a) * rr, z: Math.sin(a) * rr, h, w, rot: rng() * Math.PI });
      }
      return { ...ring, items };
    });
  }, []);
  return (
    <group>
      {geos.map((ring, ri) =>
        ring.items.map((p, i) => (
          <mesh key={`${ri}-${i}`} position={[p.x, p.h / 2 - 2, p.z]} rotation={[0, p.rot, 0]}>
            <coneGeometry args={[p.w, p.h, 4]} />
            <meshStandardMaterial color={ring.color} roughness={1} flatShading />
          </mesh>
        ))
      )}
    </group>
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
        const r = violet[0] + (teal[0] - violet[0]) * ty;
        const gg = violet[1] + (teal[1] - violet[1]) * ty;
        const b = violet[2] + (teal[2] - violet[2]) * ty;
        const idx = (y * W + x) * 4;
        img.data[idx] = r; img.data[idx + 1] = gg; img.data[idx + 2] = b;
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
    if (m1.current) { m1.current.material.map.offset.x = e * 0.01; m1.current.material.opacity = 0.5 + 0.14 * Math.sin(e * 0.5); }
    if (m2.current) { m2.current.material.map.offset.x = -e * 0.006; m2.current.material.opacity = 0.32 + 0.1 * Math.sin(e * 0.4 + 1); }
  });
  return (
    <group position={[0, 34, -60]} rotation={[-0.5, 0, 0]}>
      <mesh ref={m1}>
        <planeGeometry args={[220, 46]} />
        <meshBasicMaterial map={tex} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={m2} position={[20, 10, -14]}>
        <planeGeometry args={[200, 34]} />
        <meshBasicMaterial map={tex.clone()} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Ground() {
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(46, 96);
    const rng = mulberry32(99);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const d = Math.hypot(x, y);
      // gentle rolling drifts, flattened near the center (the basecamp clearing)
      const z = (Math.sin(x * 0.12) * 0.5 + Math.cos(y * 0.1) * 0.5 + (rng() - 0.5) * 0.3) * Math.min(1, d / 8);
      pos.setZ(i, z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#c2cfe6" roughness={0.95} flatShading />
    </mesh>
  );
}

export default function Environment3D() {
  const moon = useRef();
  return (
    <group>
      <fogExp2 attach="fog" args={['#101a30', 0.018]} />
      <SkyDome />
      <Stars radius={120} depth={40} count={1400} factor={3} saturation={0} fade speed={0.4} />
      <Aurora />
      <Peaks />
      <Ground />
      <ContactShadows position={[0, 0.02, 0]} scale={30} blur={2.4} far={9} opacity={0.5} color="#0a1226" resolution={1024} />

      {/* moon (key light, cool) */}
      <mesh position={[-22, 26, -40]}>
        <sphereGeometry args={[3.2, 24, 24]} />
        <meshBasicMaterial color="#eaf1ff" toneMapped={false} />
      </mesh>
      <directionalLight
        ref={moon}
        position={[-18, 24, -8]}
        intensity={1.7}
        color="#dfe9ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0004}
      />
      <hemisphereLight args={['#2a3a5e', '#0a1020', 0.5]} />
      <ambientLight intensity={0.16} color="#9fb0d0" />

      {/* drifting snow */}
      <Sparkles count={90} scale={[44, 22, 44]} position={[0, 10, 0]} size={2.4} speed={0.28} opacity={0.55} color="#eef4ff" />
      <Sparkles count={40} scale={[24, 10, 24]} position={[0, 4, 0]} size={3.6} speed={0.5} opacity={0.4} color="#ffffff" />
    </group>
  );
}

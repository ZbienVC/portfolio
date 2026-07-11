import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ── shared little material helpers ──────────────────────────────────────────
const WOOD = '#3a2c22';
const WOOD_L = '#5a4030';
const STONE = '#4a5670';
const SNOW = '#eef4fb';
const IRON = '#26242b';

function Glow({ color, intensity = 1, scale = 1 }) {
  // additive sprite-ish glow via a small emissive sphere + point light
  return (
    <>
      <pointLight color={color} intensity={intensity * 6} distance={9} decay={2} />
      <mesh scale={scale}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
    </>
  );
}

// ── the interactive wrapper ─────────────────────────────────────────────────
export function Landmark({ data, hovered, active, onHover, onSelect, children }) {
  const g = useRef();
  const isHot = hovered || active;
  const t = useRef(Math.random() * 10);

  useFrame((_, dt) => {
    t.current += dt;
    if (g.current) {
      const target = isHot ? 1.05 : 1;
      g.current.scale.setScalar(THREE.MathUtils.lerp(g.current.scale.x, target, 1 - Math.pow(0.001, dt)));
    }
  });

  return (
    <group position={data.pos}>
      <group
        ref={g}
        onPointerOver={(e) => { e.stopPropagation(); onHover(data.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); onHover(null); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onSelect(data.id); }}
      >
        {children({ lit: isHot, accent: data.accent, t })}
      </group>

      {/* floating label — billboarded, brightens on hover */}
      <Billboard position={[0, data.labelY ?? 3.4, 0]}>
        <Text
          fontSize={0.42}
          color={isHot ? data.accent : '#c6d2e4'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#0a0f1a"
          letterSpacing={0.04}
        >
          {data.label.toUpperCase()}
        </Text>
        <Text position={[0, -0.42, 0]} fontSize={0.16} color="#647698" anchorX="center" anchorY="middle" letterSpacing={0.24}>
          {isHot ? '▸ ENTER' : data.hint}
        </Text>
      </Billboard>

      {/* base ring — reads as interactive */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.15, 1.32, 40]} />
        <meshBasicMaterial color={data.accent} transparent opacity={isHot ? 0.55 : 0.16} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ── landmark geometries ─────────────────────────────────────────────────────
function pulse(t, base, amp = 0.4, freq = 1.6) {
  return base + amp * (0.5 + 0.5 * Math.sin(t.current * freq));
}

export function Cabin({ lit, accent, t }) {
  const win = useRef();
  useFrame(() => { if (win.current) win.current.material.emissiveIntensity = pulse(t, lit ? 2.6 : 1.4, 0.5, 1.2); });
  return (
    <group>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.6, 1.8]} />
        <meshStandardMaterial color={WOOD_L} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.75, 1.1, 4]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 2.14, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.62, 0.95, 4]} />
        <meshStandardMaterial color={SNOW} roughness={1} flatShading />
      </mesh>
      {/* glowing windows on the front (+Z) */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} ref={x > 0 ? win : undefined} position={[x, 0.85, 0.91]}>
          <planeGeometry args={[0.5, 0.66]} />
          <meshStandardMaterial color="#1a1206" emissive={'#ffcf87'} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      <group position={[0, 0.85, 1.4]}>
        <pointLight color="#ffcf87" intensity={lit ? 9 : 5} distance={8} decay={2} />
      </group>
    </group>
  );
}

export function Monoliths({ lit, accent, t }) {
  // flagship "Projects" — a cluster of tall glowing standing slabs
  const refs = [useRef(), useRef(), useRef(), useRef()];
  useFrame(() => {
    refs.forEach((r, i) => { if (r.current) r.current.material.emissiveIntensity = pulse(t, lit ? 2.4 : 1.5, 0.5, 1.1 + i * 0.2); });
  });
  const slabs = [
    [-1.1, 2.4, 0.2, '#5fd6c4'],
    [0, 3.2, -0.3, accent],
    [1.1, 2.7, 0.1, '#f0b978'],
    [0.4, 1.9, 0.7, '#5fd6c4'],
  ];
  return (
    <group>
      {slabs.map(([x, h, z, c], i) => (
        <group key={i} position={[x, h / 2, z]}>
          <mesh ref={refs[i]} castShadow>
            <boxGeometry args={[0.5, h, 0.16]} />
            <meshStandardMaterial color="#12151f" emissive={c} emissiveIntensity={1.6} toneMapped={false} flatShading />
          </mesh>
        </group>
      ))}
      <pointLight color={accent} intensity={lit ? 10 : 6} distance={10} decay={2} position={[0, 2, 0.5]} />
    </group>
  );
}

export function Cairn({ lit, accent, t }) {
  const flag = useRef();
  useFrame(() => { if (flag.current) flag.current.rotation.z = 0.1 * Math.sin(t.current * 2); });
  const stones = [[1.1, 0.35], [0.95, 0.85], [0.75, 1.3], [0.55, 1.7], [0.38, 2.0]];
  return (
    <group>
      {stones.map(([r, y], i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, i * 0.6, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={STONE} roughness={0.95} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]} scale={[1, 0.5, 1]} castShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={SNOW} roughness={1} flatShading />
      </mesh>
      <mesh position={[0.1, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
        <meshStandardMaterial color={IRON} roughness={0.7} />
      </mesh>
      <mesh ref={flag} position={[0.42, 3.2, 0]}>
        <planeGeometry args={[0.6, 0.36]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={lit ? 0.8 : 0.3} side={THREE.DoubleSide} flatShading />
      </mesh>
    </group>
  );
}

export function Cache({ lit, accent, t }) {
  // Skills — a supply crate + a leaning snowboard (nod to his snowboarding) + lantern
  const lamp = useRef();
  useFrame(() => { if (lamp.current) lamp.current.material.emissiveIntensity = pulse(t, lit ? 2.4 : 1.4, 0.5, 1.4); });
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 1.1, 1.0]} />
        <meshStandardMaterial color={WOOD_L} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.36, 0.12, 1.06]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} flatShading />
      </mesh>
      {/* leaning snowboard */}
      <mesh position={[-0.85, 1.1, 0.2]} rotation={[0, 0.2, 0.35]} castShadow>
        <boxGeometry args={[0.34, 2.2, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.1} flatShading />
      </mesh>
      {/* lantern on the crate */}
      <group position={[0.5, 1.35, 0.1]}>
        <mesh ref={lamp}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial color="#1a1206" emissive="#ffcf87" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <pointLight color="#ffcf87" intensity={lit ? 6 : 3.5} distance={6} decay={2} />
      </group>
    </group>
  );
}

export function FrozenLake({ lit, accent, t }) {
  // Life — a reflective ice sheet + a wooden photo easel at its edge
  const frame = useRef();
  useFrame(() => { if (frame.current) frame.current.material.emissiveIntensity = pulse(t, lit ? 0.9 : 0.4, 0.25, 1.2); });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[2.4, 48]} />
        <MeshReflectorMaterial
          resolution={512}
          mirror={0.55}
          mixBlur={7}
          mixStrength={2.2}
          blur={[300, 80]}
          roughness={0.5}
          depthScale={0.8}
          color="#8299bd"
          metalness={0.6}
        />
      </mesh>
      {/* photo easel */}
      <group position={[0, 0, 1.4]}>
        <mesh position={[0, 0.7, 0]} rotation={[0.06, 0, 0]} castShadow>
          <boxGeometry args={[1.1, 1.4, 0.08]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} flatShading />
        </mesh>
        <mesh ref={frame} position={[0, 0.75, 0.05]} rotation={[0.06, 0, 0]}>
          <planeGeometry args={[0.9, 1.15]} />
          <meshStandardMaterial color="#cfd9ec" emissive={accent} emissiveIntensity={0.5} flatShading />
        </mesh>
        <mesh position={[-0.35, 0.1, 0.3]} rotation={[1.1, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 5]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
        <mesh position={[0.35, 0.1, 0.3]} rotation={[1.1, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 5]} />
          <meshStandardMaterial color={WOOD} />
        </mesh>
      </group>
    </group>
  );
}

export function Signpost({ lit, accent, t }) {
  const lamp = useRef();
  useFrame(() => { if (lamp.current) lamp.current.material.emissiveIntensity = pulse(t, lit ? 2.4 : 1.4, 0.5, 1.3); });
  return (
    <group>
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 2.6, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} flatShading />
      </mesh>
      {[[1.6, 0.5, -0.5], [2.05, -0.35, 0.6], [1.15, 0.55, 0.4]].map(([y, rot, off], i) => (
        <group key={i} position={[off > 0 ? 0.5 : -0.5, y, 0]} rotation={[0, rot, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.1, 0.34, 0.07]} />
            <meshStandardMaterial color={i === 0 ? accent : WOOD_L} roughness={0.85} flatShading />
          </mesh>
        </group>
      ))}
      <group position={[0, 2.75, 0]}>
        <mesh ref={lamp}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color="#1a1206" emissive="#ffcf87" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <pointLight color="#ffcf87" intensity={lit ? 6 : 3.5} distance={7} decay={2} />
      </group>
    </group>
  );
}

export const GEOM = {
  cabin: Cabin,
  monoliths: Monoliths,
  cairn: Cairn,
  cache: Cache,
  lake: FrozenLake,
  signpost: Signpost,
};

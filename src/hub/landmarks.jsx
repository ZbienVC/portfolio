import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { woodMaps, rockMaps, makeSoftDisc } from './textures.js';

const SNOW = '#e8eff9';

// snow mound — grounds a structure into the drifts instead of floating on them
function Mound({ r = 1.6, y = 0.05 }) {
  return (
    <mesh position={[0, y, 0]} scale={[1, 0.22, 1]} receiveShadow>
      <sphereGeometry args={[r, 20, 12]} />
      <meshStandardMaterial color="#dbe5f4" roughness={1} />
    </mesh>
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
      const target = isHot ? 1.04 : 1;
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

      <Billboard position={[0, data.labelY ?? 3.4, 0]}>
        <Text
          fontSize={0.4}
          color={isHot ? data.accent : '#c6d2e4'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.014}
          outlineColor="#0a0f1a"
          letterSpacing={0.05}
        >
          {data.label.toUpperCase()}
        </Text>
        <Text position={[0, -0.4, 0]} fontSize={0.155} color={isHot ? '#e9edf6' : '#647698'} anchorX="center" anchorY="middle" letterSpacing={0.24} outlineWidth={0.008} outlineColor="#0a0f1a">
          {isHot ? '▸ SEND THE FOX' : data.hint}
        </Text>
      </Billboard>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[1.2, 1.34, 44]} />
        <meshBasicMaterial color={data.accent} transparent opacity={isHot ? 0.6 : 0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── landmark geometries ─────────────────────────────────────────────────────
function pulse(t, base, amp = 0.4, freq = 1.6) {
  return base + amp * (0.5 + 0.5 * Math.sin(t.current * freq));
}

function ChimneySmoke({ position }) {
  const tex = useMemo(() => makeSoftDisc('150,160,185'), []);
  const puffs = useRef([]);
  useFrame((s) => {
    const e = s.clock.elapsedTime;
    puffs.current.forEach((p, i) => {
      if (!p) return;
      const ph = (e * 0.28 + i / 3) % 1;
      p.position.y = ph * 2.4;
      p.position.x = Math.sin(e * 0.7 + i * 2) * 0.18 * ph;
      const s2 = 0.25 + ph * 0.9;
      p.scale.setScalar(s2);
      p.material.opacity = 0.36 * Math.sin(ph * Math.PI);
    });
  });
  return (
    <group position={position}>
      {[0, 1, 2].map((i) => (
        <sprite key={i} ref={(el) => (puffs.current[i] = el)}>
          <spriteMaterial map={tex} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
    </group>
  );
}

export function Cabin({ lit, accent, t }) {
  const wood = useMemo(() => woodMaps(), []);
  const win = useRef();
  useFrame(() => { if (win.current) win.current.material.emissiveIntensity = pulse(t, lit ? 2.8 : 1.6, 0.5, 1.2); });
  return (
    <group>
      <Mound r={2.3} />
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 1.7, 1.9]} />
        <meshStandardMaterial map={wood.map} bumpMap={wood.bumpMap} bumpScale={0.6} roughness={0.85} />
      </mesh>
      {/* pitched roof + snow blanket */}
      <mesh position={[0, 2.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.85, 1.15, 4]} />
        <meshStandardMaterial color="#2e2119" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.26, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.72, 1.0, 4]} />
        <meshStandardMaterial color={SNOW} roughness={1} />
      </mesh>
      {/* chimney + smoke */}
      <mesh position={[0.62, 2.6, -0.3]} castShadow>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
        <meshStandardMaterial map={rockMaps().map} roughness={0.95} />
      </mesh>
      <ChimneySmoke position={[0.62, 3.1, -0.3]} />
      {/* door with warm seam */}
      <mesh position={[-0.45, 0.62, 0.96]}>
        <boxGeometry args={[0.55, 1.15, 0.06]} />
        <meshStandardMaterial map={wood.map} roughness={0.8} color="#8a6a48" />
      </mesh>
      {/* glowing windows on the front (+Z) */}
      {[0.35, 0.85].map((x, i) => (
        <group key={i} position={[x, 0.95, 0.96]}>
          <mesh>
            <boxGeometry args={[0.5, 0.6, 0.04]} />
            <meshStandardMaterial color="#241a10" roughness={0.6} />
          </mesh>
          <mesh ref={i === 0 ? win : undefined} position={[0, 0, 0.03]}>
            <planeGeometry args={[0.42, 0.52]} />
            <meshStandardMaterial color="#1a1206" emissive={'#ffcf87'} emissiveIntensity={1.8} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0.6, 1.0, 1.6]} color="#ffcf87" intensity={lit ? 11 : 6} distance={9} decay={2} />
    </group>
  );
}

export function Monoliths({ lit, accent, t }) {
  const refs = [useRef(), useRef(), useRef(), useRef()];
  useFrame(() => {
    refs.forEach((r, i) => { if (r.current) r.current.material.emissiveIntensity = pulse(t, lit ? 2.6 : 1.6, 0.5, 1.1 + i * 0.2); });
  });
  const rock = useMemo(() => rockMaps(), []);
  const slabs = [
    [-1.15, 2.4, 0.2, '#5fd6c4', -0.06],
    [0, 3.3, -0.3, accent, 0.03],
    [1.15, 2.7, 0.1, '#f0b978', 0.06],
    [0.45, 1.9, 0.75, '#5fd6c4', -0.04],
  ];
  return (
    <group>
      <Mound r={2.1} />
      {slabs.map(([x, h, z, c, tilt], i) => (
        <group key={i} position={[x, h / 2, z]} rotation={[0, i * 0.3, tilt]}>
          {/* stone frame */}
          <mesh castShadow>
            <boxGeometry args={[0.6, h, 0.26]} />
            <meshStandardMaterial map={rock.map} bumpMap={rock.bumpMap} bumpScale={0.5} roughness={0.9} />
          </mesh>
          {/* inset glowing face */}
          <mesh ref={refs[i]} position={[0, 0, 0.14]}>
            <planeGeometry args={[0.42, h - 0.3]} />
            <meshStandardMaterial color="#0c0f18" emissive={c} emissiveIntensity={1.8} toneMapped={false} />
          </mesh>
          {/* snow on top */}
          <mesh position={[0, h / 2 + 0.03, 0]} scale={[1, 0.3, 1]}>
            <sphereGeometry args={[0.32, 10, 8]} />
            <meshStandardMaterial color={SNOW} roughness={1} />
          </mesh>
        </group>
      ))}
      <pointLight color={accent} intensity={lit ? 11 : 7} distance={11} decay={2} position={[0, 2.2, 0.6]} />
    </group>
  );
}

export function Cairn({ lit, accent, t }) {
  const flag = useRef();
  useFrame(() => { if (flag.current) flag.current.rotation.z = 0.12 * Math.sin(t.current * 2); });
  const rock = useMemo(() => rockMaps(), []);
  const stones = [[1.1, 0.35], [0.95, 0.85], [0.75, 1.3], [0.55, 1.7], [0.38, 2.0]];
  return (
    <group>
      <Mound r={1.8} />
      {stones.map(([r, y], i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[0, i * 0.6, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial map={rock.map} bumpMap={rock.bumpMap} bumpScale={0.5} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]} scale={[1, 0.5, 1]} castShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={SNOW} roughness={1} />
      </mesh>
      <mesh position={[0.1, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
        <meshStandardMaterial color="#1e1c22" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh ref={flag} position={[0.42, 3.2, 0]}>
        <planeGeometry args={[0.6, 0.36, 6, 1]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={lit ? 0.9 : 0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Cache({ lit, accent, t }) {
  const wood = useMemo(() => woodMaps(), []);
  const lamp = useRef();
  useFrame(() => { if (lamp.current) lamp.current.material.emissiveIntensity = pulse(t, lit ? 2.6 : 1.5, 0.5, 1.4); });
  return (
    <group>
      <Mound r={1.7} />
      <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 1.1, 1.05]} />
        <meshStandardMaterial map={wood.map} bumpMap={wood.bumpMap} bumpScale={0.5} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[1.42, 0.14, 1.12]} />
        <meshStandardMaterial map={wood.map} roughness={0.9} color="#4a3626" />
      </mesh>
      {/* snow dusting the lid */}
      <mesh position={[0, 1.28, 0]} scale={[1, 0.16, 1]}>
        <sphereGeometry args={[0.7, 12, 8]} />
        <meshStandardMaterial color={SNOW} roughness={1} />
      </mesh>
      {/* leaning snowboard — glossy premium deck */}
      <group position={[-0.92, 1.05, 0.22]} rotation={[0.05, 0.25, 0.4]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.19, 1.7, 4, 12]} />
          <meshStandardMaterial color={accent} roughness={0.22} metalness={0.15} envMapIntensity={1.2} />
        </mesh>
      </group>
      <group position={[0.52, 1.5, 0.12]}>
        <mesh ref={lamp}>
          <sphereGeometry args={[0.16, 14, 14]} />
          <meshStandardMaterial color="#1a1206" emissive="#ffcf87" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <pointLight color="#ffcf87" intensity={lit ? 7 : 4} distance={7} decay={2} />
      </group>
    </group>
  );
}

export function FrozenLake({ lit, accent, t }) {
  const frame = useRef();
  const wood = useMemo(() => woodMaps(), []);
  useFrame(() => { if (frame.current) frame.current.material.emissiveIntensity = pulse(t, lit ? 1.0 : 0.45, 0.25, 1.2); });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
        <circleGeometry args={[2.5, 48]} />
        <MeshReflectorMaterial
          resolution={640}
          mirror={0.6}
          mixBlur={6}
          mixStrength={2.6}
          blur={[280, 70]}
          roughness={0.38}
          depthScale={0.8}
          color="#8fa5c9"
          metalness={0.65}
        />
      </mesh>
      {/* rim of snow-dusted stones around the ice */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.5, 0.12, Math.sin(a) * 2.5]} rotation={[0, a, 0]} castShadow>
            <dodecahedronGeometry args={[0.2 + (i % 3) * 0.07, 0]} />
            <meshStandardMaterial color="#5b6880" roughness={0.95} />
          </mesh>
        );
      })}
      {/* photo easel at the shore */}
      <group position={[0, 0, 1.9]}>
        <mesh position={[0, 0.72, 0]} rotation={[0.06, 0, 0]} castShadow>
          <boxGeometry args={[1.1, 1.4, 0.09]} />
          <meshStandardMaterial map={wood.map} bumpMap={wood.bumpMap} bumpScale={0.4} roughness={0.9} />
        </mesh>
        <mesh ref={frame} position={[0, 0.77, 0.06]} rotation={[0.06, 0, 0]}>
          <planeGeometry args={[0.9, 1.15]} />
          <meshStandardMaterial color="#cfd9ec" emissive={accent} emissiveIntensity={0.55} />
        </mesh>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.3]} rotation={[1.1, 0, x > 0 ? -0.2 : 0.2]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 1.5, 6]} />
            <meshStandardMaterial color="#2e2119" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Signpost({ lit, accent, t }) {
  const wood = useMemo(() => woodMaps(), []);
  const lamp = useRef();
  useFrame(() => { if (lamp.current) lamp.current.material.emissiveIntensity = pulse(t, lit ? 2.6 : 1.5, 0.5, 1.3); });
  return (
    <group>
      <Mound r={1.3} />
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 2.6, 8]} />
        <meshStandardMaterial map={wood.map} bumpMap={wood.bumpMap} bumpScale={0.4} roughness={0.9} />
      </mesh>
      {[[1.62, 0.5, -0.5], [2.06, -0.35, 0.6], [1.18, 0.55, 0.4]].map(([y, rot, off], i) => (
        <group key={i} position={[off > 0 ? 0.5 : -0.5, y, 0]} rotation={[0, rot, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.1, 0.32, 0.07]} />
            <meshStandardMaterial map={wood.map} roughness={0.85} color={i === 0 ? accent : '#7a5a3c'} />
          </mesh>
        </group>
      ))}
      {/* snow on the top arm */}
      <mesh position={[0, 2.62, 0]} scale={[1, 0.25, 1]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color={SNOW} roughness={1} />
      </mesh>
      <group position={[0, 2.85, 0]}>
        <mesh ref={lamp}>
          <sphereGeometry args={[0.15, 14, 14]} />
          <meshStandardMaterial color="#1a1206" emissive="#ffcf87" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <pointLight color="#ffcf87" intensity={lit ? 7 : 4} distance={8} decay={2} />
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

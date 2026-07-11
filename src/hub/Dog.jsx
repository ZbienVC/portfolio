import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeSoftDisc } from './textures.js';

// The guide — a CC0 rigged canine (Khronos "Fox", public domain).
// It TRAVELS: give it a target and it trots/runs there at real speed, leaves
// footprints in the snow, and fires onArrive when it gets there. Swap the
// .glb at /models/fox.glb (clips Survey/Walk/Run) to change the character.
const CLIP = { idle: 'Survey', walk: 'Walk', run: 'Run' };
const WALK_SPEED = 2.7;
const RUN_SPEED = 5.4;
const RUN_DIST = 7; // farther than this → gallop
const ARRIVE_EPS = 0.35;

const FOOTPRINTS = 42;

function Footprints({ api }) {
  const tex = useMemo(() => makeSoftDisc('26,34,54'), []);
  const meshes = useRef([]);
  // expose a stamp() the dog calls while moving
  useEffect(() => {
    let next = 0;
    api.current = (x, z, heading, side) => {
      const m = meshes.current[next];
      if (!m) return;
      next = (next + 1) % FOOTPRINTS;
      const lat = side * 0.09;
      m.position.set(x + Math.cos(heading) * lat, 0.04, z - Math.sin(heading) * lat);
      m.rotation.z = -heading;
      m.userData.t0 = performance.now();
      m.visible = true;
    };
  }, [api]);
  useFrame(() => {
    const now = performance.now();
    for (const m of meshes.current) {
      if (!m || !m.visible) continue;
      const age = (now - m.userData.t0) / 1000;
      if (age > 9) { m.visible = false; continue; }
      m.material.opacity = 0.4 * Math.max(0, 1 - age / 9);
    }
  });
  return (
    <group>
      {Array.from({ length: FOOTPRINTS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => (meshes.current[i] = el)}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          renderOrder={1}
        >
          <planeGeometry args={[0.26, 0.36]} />
          <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Dog({ target, lookAt = null, onArrive, wander = false }) {
  const group = useRef();
  const rig = useRef();
  const { scene, animations } = useGLTF('/models/fox.glb');
  const { actions } = useAnimations(animations, group);
  const state = useRef('idle');
  const stamp = useRef(null);
  const stride = useRef(0);
  const stepSide = useRef(1);
  const arrived = useRef(true);
  // idle wandering — the fox sniffs around basecamp when left alone
  const wanderPt = useRef(null);
  const idleFor = useRef(0);
  const nextWanderIn = useRef(6);

  useEffect(() => {
    scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  }, [scene]);

  useEffect(() => {
    const idle = actions[CLIP.idle];
    idle?.reset().fadeIn(0.3).play();
    return () => idle?.fadeOut(0.2);
  }, [actions]);

  // new target → not arrived yet; cancel any idle wandering
  useEffect(() => {
    arrived.current = false;
    wanderPt.current = null;
    idleFor.current = 0;
  }, [target]);

  const setClip = (want, timeScale = 1) => {
    if (want === state.current) {
      const a = actions[CLIP[want]];
      if (a) a.timeScale = timeScale;
      return;
    }
    actions[CLIP[state.current]]?.fadeOut(0.22);
    const to = actions[CLIP[want]];
    if (to) { to.reset().fadeIn(0.22).play(); to.timeScale = timeScale; }
    state.current = want;
  };

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // idle wander: after a quiet stretch at home, pick a nearby sniff spot
    if (wander && arrived.current && !wanderPt.current) {
      idleFor.current += dt;
      if (idleFor.current > nextWanderIn.current) {
        const a = Math.random() * Math.PI * 2;
        const r = 1.6 + Math.random() * 2.2;
        wanderPt.current = [
          target.point[0] + Math.cos(a) * r,
          target.point[2] + Math.sin(a) * r * 0.7,
        ];
        idleFor.current = 0;
        nextWanderIn.current = 5 + Math.random() * 6;
      }
    }
    const pt = wanderPt.current
      ? [wanderPt.current[0], 0, wanderPt.current[1]]
      : target?.point || [0, 0, 0];
    const [tx, , tz] = pt;
    const dx = tx - g.position.x;
    const dz = tz - g.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > ARRIVE_EPS) {
      // travel at real speed — walk near, gallop far
      const run = dist > RUN_DIST;
      const speed = run ? RUN_SPEED : WALK_SPEED;
      const step = Math.min(speed * dt, dist);
      const nx = dx / dist, nz = dz / dist;
      g.position.x += nx * step;
      g.position.z += nz * step;
      setClip(run ? 'run' : 'walk', run ? 1 : 1.1);

      // face travel direction (shortest arc)
      const desired = Math.atan2(dx, dz);
      if (rig.current) {
        let d = desired - rig.current.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        rig.current.rotation.y += d * (1 - Math.pow(0.0005, dt));
      }

      // stamp footprints by distance travelled
      stride.current += step;
      const strideLen = run ? 0.62 : 0.42;
      if (stride.current > strideLen && stamp.current) {
        stride.current = 0;
        stepSide.current *= -1;
        stamp.current(g.position.x, g.position.z, desired, stepSide.current);
      }
    } else {
      if (wanderPt.current) wanderPt.current = null; // sniffed the spot — settle
      if (!arrived.current) {
        arrived.current = true;
        onArrive?.(target?.id ?? null);
      }
      setClip('idle', 1);
      // settle facing toward the landmark (or camera at rest)
      if (lookAt && rig.current) {
        const desired = Math.atan2(lookAt[0] - g.position.x, lookAt[2] - g.position.z);
        let d = desired - rig.current.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        rig.current.rotation.y += d * (1 - Math.pow(0.005, dt));
      }
    }
  });

  return (
    <>
      <group ref={group} position={[0.6, 0, 1.6]}>
        <group ref={rig}>
          {/* the Fox GLB natively faces +Z — no flip, or it moonwalks */}
          <primitive object={scene} scale={0.019} />
        </group>
        {/* soft contact blob so the fox sits IN the snow, not on it */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <circleGeometry args={[0.55, 24]} />
          <meshBasicMaterial color="#0c1424" transparent opacity={0.32} depthWrite={false} />
        </mesh>
      </group>
      <Footprints api={stamp} />
    </>
  );
}

useGLTF.preload('/models/fox.glb');

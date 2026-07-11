import { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// The guide — a CC0 rigged canine (Khronos "Fox", public domain). Crossfades
// idle↔walk, drifts toward a target, and turns to face the active landmark.
// Swap the .glb at /models/fox.glb to change the character (same clip names
// Survey/Walk/Run, or update the CLIP map below).
const CLIP = { idle: 'Survey', walk: 'Walk', run: 'Run' };

export default function Dog({ target = [0, 0, 0], lookAt = null }) {
  const group = useRef();
  const rig = useRef();
  const { scene, animations } = useGLTF('/models/fox.glb');
  const { actions } = useAnimations(animations, group);
  const state = useRef('idle');
  const tmp = useRef(new THREE.Vector3());

  useEffect(() => {
    const idle = actions[CLIP.idle];
    idle?.reset().fadeIn(0.3).play();
    return () => idle?.fadeOut(0.2);
  }, [actions]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const [tx, , tz] = target;
    // drift toward target
    const dx = tx - g.position.x;
    const dz = tz - g.position.z;
    const dist = Math.hypot(dx, dz);
    const moving = dist > 0.06;
    const k = 1 - Math.pow(0.001, dt); // dt-normalized ease
    g.position.x += dx * k;
    g.position.z += dz * k;

    // desired facing: toward motion while moving, else toward lookAt (landmark)
    let yaw = rig.current ? rig.current.rotation.y : 0;
    let desired = yaw;
    if (moving) desired = Math.atan2(dx, dz);
    else if (lookAt) desired = Math.atan2(lookAt[0] - g.position.x, lookAt[2] - g.position.z);
    if (rig.current) {
      // shortest-arc lerp
      let d = desired - rig.current.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      rig.current.rotation.y += d * (1 - Math.pow(0.002, dt));
    }

    // clip state
    const want = moving ? 'walk' : 'idle';
    if (want !== state.current) {
      const from = actions[CLIP[state.current]];
      const to = actions[CLIP[want]];
      from?.fadeOut(0.25);
      to?.reset().fadeIn(0.25).play();
      to && (to.timeScale = want === 'walk' ? 1.1 : 1);
      state.current = want;
    }
  });

  return (
    <group ref={group}>
      {/* rig wrapper for yaw; the Fox model faces +Z, scaled to ~dog height */}
      <group ref={rig}>
        <primitive object={scene} scale={0.019} rotation={[0, Math.PI, 0]} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/fox.glb');

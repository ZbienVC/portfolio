import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField } from '@react-three/postprocessing';
import * as THREE from 'three';
import Environment3D from './Environment3D.jsx';
import Dog from './Dog.jsx';
import { Landmark, GEOM } from './landmarks.jsx';

// Arranged so the front-center corridor (camera → dog) stays clear.
export const LANDMARKS = [
  { id: 'projects', label: 'Projects', hint: '10 live', kind: 'monoliths', accent: '#e0a155', pos: [-2.4, 0, -9.5], labelY: 4.0 },
  { id: 'about', label: 'About', hint: 'who I am', kind: 'cabin', accent: '#f0b978', pos: [-7.2, 0, -3.5], labelY: 3.7 },
  { id: 'experience', label: 'Experience', hint: 'the climb', kind: 'cairn', accent: '#c9a25e', pos: [7.2, 0, -3.5], labelY: 3.9 },
  { id: 'life', label: 'Life', hint: 'off the clock', kind: 'lake', accent: '#5fd6c4', pos: [-7.4, 0, 3.2], labelY: 2.7 },
  { id: 'skills', label: 'Skills', hint: 'the kit', kind: 'cache', accent: '#d8b07a', pos: [7.6, 0, 1.5], labelY: 2.7 },
  { id: 'contact', label: 'Contact', hint: 'say hi', kind: 'signpost', accent: '#f0b978', pos: [3.4, 0, 6.5], labelY: 3.4 },
];

const OVERVIEW = { pos: [0, 5.4, 16], look: [0, 1.2, -1] };

function CameraRig({ active }) {
  const cc = useRef();

  useEffect(() => {
    const c = cc.current;
    if (!c) return;
    if (!active) {
      c.setLookAt(...OVERVIEW.pos, ...OVERVIEW.look, true);
      return;
    }
    const lm = LANDMARKS.find((l) => l.id === active);
    if (!lm) return;
    const P = new THREE.Vector3(...lm.pos);
    const inward = P.clone().multiplyScalar(-1).normalize();
    const cam = P.clone().add(inward.multiplyScalar(5.6)).add(new THREE.Vector3(0, 2.7, 0));
    c.setLookAt(cam.x, cam.y, cam.z, P.x, P.y + 1.2, P.z, true);
  }, [active]);

  return (
    <CameraControls
      ref={cc}
      minPolarAngle={0.5}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={5}
      maxDistance={22}
      smoothTime={0.55}
      draggingSmoothTime={0.15}
      dollySpeed={0.4}
      truckSpeed={0}
    />
  );
}

export default function HubScene({ active, hovered, onHover, onSelect }) {
  // dog walks partway toward the active landmark and faces it; idles at center
  let dogTarget = [0, 0, 0];
  let dogLookAt = [0, 1, 25];
  if (active) {
    const lm = LANDMARKS.find((l) => l.id === active);
    if (lm) {
      const P = new THREE.Vector3(...lm.pos);
      const t = P.clone().normalize().multiplyScalar(Math.min(2.6, P.length() - 2.2));
      dogTarget = [t.x, 0, t.z];
      dogLookAt = lm.pos;
    }
  }

  return (
    <>
      <color attach="background" args={['#0a0f1e']} />
      <Environment3D />
      <Dog target={dogTarget} lookAt={dogLookAt} />

      {LANDMARKS.map((lm) => {
        const Geom = GEOM[lm.kind];
        return (
          <Landmark
            key={lm.id}
            data={lm}
            hovered={hovered === lm.id}
            active={active === lm.id}
            onHover={onHover}
            onSelect={onSelect}
          >
            {(props) => <Geom {...props} />}
          </Landmark>
        );
      })}

      <CameraRig active={active} />

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />
        <DepthOfField focusDistance={0.012} focalLength={0.04} bokehScale={2.2} />
        <Vignette eskil={false} offset={0.28} darkness={0.72} />
        <Noise opacity={0.045} premultiply />
      </EffectComposer>
    </>
  );
}

import { useEffect, useRef } from 'react';
import { CameraControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField, N8AO } from '@react-three/postprocessing';
import * as THREE from 'three';
import Environment3D from './Environment3D.jsx';
import Dog from './Dog.jsx';
import { Landmark, GEOM } from './landmarks.jsx';

// Arranged so the front-center corridor (camera → fox) stays clear.
export const LANDMARKS = [
  { id: 'projects', label: 'Projects', hint: '10 live', kind: 'monoliths', accent: '#e0a155', pos: [-2.4, 0, -9.5], labelY: 4.0 },
  { id: 'about', label: 'About', hint: 'who I am', kind: 'cabin', accent: '#f0b978', pos: [-7.2, 0, -3.5], labelY: 3.7 },
  { id: 'experience', label: 'Experience', hint: 'the climb', kind: 'cairn', accent: '#c9a25e', pos: [7.2, 0, -3.5], labelY: 3.9 },
  { id: 'life', label: 'Life', hint: 'off the clock', kind: 'lake', accent: '#5fd6c4', pos: [-7.4, 0, 3.2], labelY: 2.7 },
  { id: 'skills', label: 'Skills', hint: 'the kit', kind: 'cache', accent: '#d8b07a', pos: [7.6, 0, 1.5], labelY: 2.7 },
  { id: 'contact', label: 'Contact', hint: 'say hi', kind: 'signpost', accent: '#f0b978', pos: [3.4, 0, 6.5], labelY: 3.4 },
];

export const HOME = [0.6, 0, 1.6];
const OVERVIEW = { pos: [0, 5.4, 16], look: [0, 1.2, -1] };

// where the fox stands when visiting a landmark (just outside its ring)
export function approachPoint(lm) {
  const P = new THREE.Vector3(...lm.pos);
  const inward = P.clone().setY(0).normalize();
  return P.clone().sub(inward.multiplyScalar(2.1));
}

function CameraRig({ focus, traveling }) {
  const cc = useRef();

  useEffect(() => {
    const c = cc.current;
    if (!c) return;
    if (!focus) {
      c.smoothTime = 0.6;
      c.setLookAt(...OVERVIEW.pos, ...OVERVIEW.look, true);
      return;
    }
    const lm = LANDMARKS.find((l) => l.id === focus);
    if (!lm) return;
    const P = new THREE.Vector3(...lm.pos);
    const inward = P.clone().setY(0).multiplyScalar(-1).normalize();
    if (traveling) {
      // wide "walking shot": pull toward the landmark slowly so you watch the fox travel
      const cam = P.clone().add(inward.clone().multiplyScalar(9.5)).add(new THREE.Vector3(0, 4.2, 0));
      c.smoothTime = 1.25;
      c.setLookAt(cam.x, cam.y, cam.z, P.x * 0.5, 1.0, P.z * 0.5, true);
    } else {
      // arrival framing: settle close, landmark + fox in frame
      const cam = P.clone().add(inward.clone().multiplyScalar(5.6)).add(new THREE.Vector3(0, 2.6, 0));
      c.smoothTime = 0.55;
      c.setLookAt(cam.x, cam.y, cam.z, P.x, P.y + 1.2, P.z, true);
    }
  }, [focus, traveling]);

  return (
    <CameraControls
      ref={cc}
      minPolarAngle={0.5}
      maxPolarAngle={Math.PI / 2 - 0.06}
      minDistance={5}
      maxDistance={22}
      smoothTime={0.6}
      draggingSmoothTime={0.15}
      dollySpeed={0.4}
      truckSpeed={0}
    />
  );
}

export default function HubScene({ active, pending, roam, hovered, onHover, onSelect, onArrive, onGroundClick }) {
  const journeyId = pending || active;
  const lm = journeyId ? LANDMARKS.find((l) => l.id === journeyId) : null;

  let dogTarget;
  let dogLookAt = [0, 1, 25]; // face the viewer at rest
  if (lm) {
    const p = approachPoint(lm);
    dogTarget = { point: [p.x, 0, p.z], id: lm.id };
    dogLookAt = lm.pos;
  } else if (roam) {
    dogTarget = { point: [roam[0], 0, roam[1]], id: null };
  } else {
    dogTarget = { point: HOME, id: null };
  }

  return (
    <>
      <color attach="background" args={['#0a0f1e']} />
      <Environment3D onGroundClick={onGroundClick} />
      <Dog target={dogTarget} lookAt={dogLookAt} onArrive={onArrive} />

      {LANDMARKS.map((l) => {
        const Geom = GEOM[l.kind];
        return (
          <Landmark
            key={l.id}
            data={l}
            hovered={hovered === l.id}
            active={active === l.id || pending === l.id}
            onHover={onHover}
            onSelect={onSelect}
          >
            {(props) => <Geom {...props} />}
          </Landmark>
        );
      })}

      <CameraRig focus={journeyId} traveling={!!pending} />

      <EffectComposer multisampling={4}>
        <N8AO aoRadius={1.6} intensity={2.8} distanceFalloff={1} quality="performance" color="#06101f" />
        <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.2} intensity={0.9} radius={0.72} />
        <DepthOfField focusDistance={0.014} focalLength={0.038} bokehScale={2.0} />
        <Vignette eskil={false} offset={0.26} darkness={0.74} />
        <Noise opacity={0.04} premultiply />
      </EffectComposer>
    </>
  );
}

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import * as THREE from 'three';
import HubScene, { LANDMARKS } from './HubScene.jsx';
import { PROFILE } from '../content/portfolio.js';
import { useTypewriter } from '../journey/hooks.js';

import AboutPanel from '../sections/AboutPanel.jsx';
import ProjectsPanel from '../sections/ProjectsPanel.jsx';
import ExperiencePanel from '../sections/ExperiencePanel.jsx';
import SkillsPanel from '../sections/SkillsPanel.jsx';
import LifePanel from '../sections/LifePanel.jsx';
import ContactPanel from '../sections/ContactPanel.jsx';

// each panel is titled after the landmark you actually visited in the world
const SECTIONS = {
  about: { Panel: AboutPanel, waypoint: { title: 'The Cabin' } },
  projects: { Panel: ProjectsPanel, waypoint: { title: 'The Monoliths' } },
  experience: { Panel: ExperiencePanel, waypoint: { title: 'The Cairn' } },
  skills: { Panel: SkillsPanel, waypoint: { title: 'The Gear Cache' } },
  life: { Panel: LifePanel, waypoint: { title: 'The Frozen Lake' } },
  contact: { Panel: ContactPanel, waypoint: { title: 'The Signpost' } },
};

function HubNav({ active, pending, onJump }) {
  const [open, setOpen] = useState(false);
  const current = pending || active;
  const go = (id) => { onJump(id); setOpen(false); };
  return (
    <nav className="hub-nav">
      <button className="jnav-logo" onClick={() => go(null)} aria-label="Overview">
        <span className="display">Z<span className="serif-italic">B</span></span>
      </button>
      <div className="jnav-links">
        <button className={`jnav-link mono${!current ? ' active' : ''}`} onClick={() => go(null)}>Basecamp</button>
        {LANDMARKS.map((l) => (
          <button key={l.id} className={`jnav-link mono${current === l.id ? ' active' : ''}`} onClick={() => go(l.id)}>
            {l.label}
          </button>
        ))}
        <a className="btn btn-ghost jnav-cta" href={PROFILE.socials.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </div>
      <button className="jnav-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? '✕' : '☰'}</button>
      {open && (
        <div className="jnav-mobile">
          <button className={`jnav-link mono${!current ? ' active' : ''}`} onClick={() => go(null)}>Basecamp</button>
          {LANDMARKS.map((l) => (
            <button key={l.id} className={`jnav-link mono${current === l.id ? ' active' : ''}`} onClick={() => go(l.id)}>{l.label}</button>
          ))}
          <a className="btn btn-ghost" href={PROFILE.socials.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      )}
    </nav>
  );
}

function HubIntro({ visible }) {
  const role = useTypewriter(PROFILE.roles);
  return (
    <div className={`hub-intro${visible ? '' : ' gone'}`}>
      <div className="eyebrow"><span className="live-dot" /> {PROFILE.availability}</div>
      <h1 className="hub-name">
        <span className="display">Zach</span> <span className="serif-italic">Bienstock</span>
      </h1>
      <div className="hub-role mono"><span className="slash">{'// '}</span>{role}<span className="caret" /></div>
      <p className="hub-tag">{PROFILE.tagline}</p>
      <p className="hub-hint mono">Click a landmark — the fox will take you · click the snow to send it exploring · drag to look around</p>
    </div>
  );
}

function SectionPanel({ id, onClose }) {
  const entry = id ? SECTIONS[id] : null;
  return (
    <div className={`hub-panel${id ? ' open' : ''}`} aria-hidden={!id}>
      {entry && (
        <div className="hub-panel-card glass">
          <button className="hub-panel-close" onClick={onClose} aria-label="Back to basecamp">✕ <span className="mono">BASECAMP</span></button>
          <div className="hub-panel-scroll">
            <entry.Panel active waypoint={entry.waypoint} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HubExperience() {
  const [active, setActive] = useState(null); // panel open at this landmark
  const [pending, setPending] = useState(null); // fox is traveling to this landmark
  const [roam, setRoam] = useState(null); // free-roam point on the snow
  const [hovered, setHovered] = useState(null);
  const pendingRef = useRef(null);
  pendingRef.current = pending;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const select = (id) => {
    setRoam(null);
    if (!id) { setActive(null); setPending(null); return; }
    if (id === active) return;
    setActive(null);
    setPending(id);
  };

  const arrive = (id) => {
    if (id && id === pendingRef.current) {
      setActive(id);
      setPending(null);
    }
  };

  const groundClick = (point) => {
    // send the fox exploring — clamp to the basecamp clearing
    const v = new THREE.Vector2(point.x, point.z);
    if (v.length() > 13) v.setLength(13);
    setActive(null);
    setPending(null);
    setRoam([v.x, v.y]);
  };

  return (
    <div className="hub-root">
      <Canvas
        shadows
        dpr={[1.5, 2]}
        camera={{ position: [0, 5.4, 16], fov: 42, near: 0.1, far: 400 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.18;
        }}
        onPointerMissed={() => { setActive(null); setPending(null); }}
      >
        <Suspense fallback={null}>
          <HubScene
            active={active}
            pending={pending}
            roam={roam}
            hovered={hovered}
            onHover={setHovered}
            onSelect={select}
            onArrive={arrive}
            onGroundClick={groundClick}
          />
        </Suspense>
      </Canvas>

      <div className="vignette" aria-hidden="true" />
      <div className={`hub-topscrim${active || pending ? ' dim' : ''}`} aria-hidden="true" />
      <HubNav active={active} pending={pending} onJump={select} />
      <HubIntro visible={!active && !pending} />
      <SectionPanel id={active} onClose={() => select(null)} />
      <Loader
        containerStyles={{ background: 'rgba(8,13,22,0.96)' }}
        barStyles={{ background: 'linear-gradient(90deg,#f0b978,#c2823a)', height: '3px' }}
        dataStyles={{ color: '#c6d2e4', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.1em' }}
        dataInterpolation={(p) => `LOADING BASECAMP ${p.toFixed(0)}%`}
      />
    </div>
  );
}

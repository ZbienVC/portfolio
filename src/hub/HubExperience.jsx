import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import HubScene, { LANDMARKS } from './HubScene.jsx';
import { PROFILE } from '../content/portfolio.js';
import { useTypewriter } from '../journey/hooks.js';

import AboutPanel from '../sections/AboutPanel.jsx';
import ProjectsPanel from '../sections/ProjectsPanel.jsx';
import ExperiencePanel from '../sections/ExperiencePanel.jsx';
import SkillsPanel from '../sections/SkillsPanel.jsx';
import LifePanel from '../sections/LifePanel.jsx';
import ContactPanel from '../sections/ContactPanel.jsx';

const SECTIONS = {
  about: AboutPanel,
  projects: ProjectsPanel,
  experience: ExperiencePanel,
  skills: SkillsPanel,
  life: LifePanel,
  contact: ContactPanel,
};

function HubNav({ active, onJump }) {
  const [open, setOpen] = useState(false);
  const go = (id) => { onJump(id); setOpen(false); };
  return (
    <nav className="hub-nav">
      <button className="jnav-logo" onClick={() => go(null)} aria-label="Overview">
        <span className="display">Z<span className="serif-italic">B</span></span>
      </button>
      <div className="jnav-links">
        <button className={`jnav-link mono${!active ? ' active' : ''}`} onClick={() => go(null)}>Basecamp</button>
        {LANDMARKS.map((l) => (
          <button key={l.id} className={`jnav-link mono${active === l.id ? ' active' : ''}`} onClick={() => go(l.id)}>
            {l.label}
          </button>
        ))}
        <a className="btn btn-ghost jnav-cta" href={PROFILE.socials.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
      </div>
      <button className="jnav-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? '✕' : '☰'}</button>
      {open && (
        <div className="jnav-mobile">
          <button className={`jnav-link mono${!active ? ' active' : ''}`} onClick={() => go(null)}>Basecamp</button>
          {LANDMARKS.map((l) => (
            <button key={l.id} className={`jnav-link mono${active === l.id ? ' active' : ''}`} onClick={() => go(l.id)}>{l.label}</button>
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
      <p className="hub-hint mono">Hover a marker to explore · drag to look around · or use the menu</p>
    </div>
  );
}

function SectionPanel({ id, onClose }) {
  const Panel = id ? SECTIONS[id] : null;
  return (
    <div className={`hub-panel${id ? ' open' : ''}`} aria-hidden={!id}>
      {Panel && (
        <div className="hub-panel-card glass">
          <button className="hub-panel-close" onClick={onClose} aria-label="Back to basecamp">✕ <span className="mono">BASECAMP</span></button>
          <div className="hub-panel-scroll">
            <Panel active />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HubExperience() {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="hub-root">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 5.2, 15.5], fov: 42, near: 0.1, far: 400 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => setActive(null)}
      >
        <Suspense fallback={null}>
          <HubScene active={active} hovered={hovered} onHover={setHovered} onSelect={setActive} />
        </Suspense>
      </Canvas>

      <div className="vignette" aria-hidden="true" />
      <div className={`hub-topscrim${active ? ' dim' : ''}`} aria-hidden="true" />
      <HubNav active={active} onJump={setActive} />
      <HubIntro visible={!active} />
      <SectionPanel id={active} onClose={() => setActive(null)} />
      <Loader
        containerStyles={{ background: 'rgba(8,13,22,0.96)' }}
        barStyles={{ background: 'linear-gradient(90deg,#f0b978,#c2823a)', height: '3px' }}
        dataStyles={{ color: '#c6d2e4', fontFamily: 'var(--mono)', fontSize: '12px', letterSpacing: '0.1em' }}
        dataInterpolation={(p) => `LOADING BASECAMP ${p.toFixed(0)}%`}
      />
    </div>
  );
}

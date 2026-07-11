import { useReveal } from '../journey/hooks.js';
import { PROFILE, HERO_STATS, WAYPOINTS } from '../content/portfolio.js';
import JourneyNav from '../journey/JourneyNav.jsx';
import { useState, useEffect } from 'react';

import AboutPanel from './AboutPanel.jsx';
import ProjectsPanel from './ProjectsPanel.jsx';
import ExperiencePanel from './ExperiencePanel.jsx';
import SkillsPanel from './SkillsPanel.jsx';
import LifePanel from './LifePanel.jsx';
import ContactPanel from './ContactPanel.jsx';

const PANELS = [
  ['about', AboutPanel],
  ['projects', ProjectsPanel],
  ['experience', ExperiencePanel],
  ['skills', SkillsPanel],
  ['life', LifePanel],
  ['contact', ContactPanel],
];

// Static, accessible vertical layout. Used when prefers-reduced-motion is set
// or the 3D/2.5D engine is unavailable. Same content, same identity, no walk.
export default function FallbackSite() {
  const root = useReveal([]);
  const [active, setActive] = useState('summit');

  useEffect(() => {
    const ids = ['summit', ...PANELS.map(([id]) => id)];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  return (
    <div className="fallback" ref={root}>
      <div className="fallback-bg" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <JourneyNav active={active} onJump={jump} />

      <header id="summit" className="fallback-hero">
        <div className="eyebrow reveal"><span className="live-dot" /> {PROFILE.availability}</div>
        <h1 className="summit-name reveal d1">
          <span>Zach</span> <span className="serif-italic">Bienstock</span>
        </h1>
        <p className="summit-tag reveal d2">{PROFILE.tagline}</p>
        <div className="summit-stats reveal d3">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-num display">{s.num}</div>
              <div className="stat-label mono">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="summit-cta-row reveal d4">
          <a className="btn btn-primary" href="#projects">View my work ↓</a>
          <a className="btn btn-ghost" href={PROFILE.resumePdf} target="_blank" rel="noopener noreferrer">Resume ↗</a>
        </div>
      </header>

      {PANELS.map(([id, Panel]) => {
        const wp = WAYPOINTS.find((w) => w.id === id);
        return (
          <section id={id} key={id} className="fallback-section">
            <Panel waypoint={wp} active />
          </section>
        );
      })}
    </div>
  );
}

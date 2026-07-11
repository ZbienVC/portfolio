import { useState } from 'react';
import { WAYPOINTS, PROFILE } from '../content/portfolio.js';

export default function JourneyNav({ active, onJump }) {
  const [open, setOpen] = useState(false);

  const go = (id) => {
    onJump(id);
    setOpen(false);
  };

  return (
    <nav className="jnav">
      <button className="jnav-logo" onClick={() => go('summit')} aria-label="Back to summit">
        <span className="display">Z<span className="serif-italic">B</span></span>
      </button>

      <div className="jnav-links">
        {WAYPOINTS.map((w) => (
          <button
            key={w.id}
            className={`jnav-link mono${active === w.id ? ' active' : ''}`}
            onClick={() => go(w.id)}
          >
            {w.nav}
          </button>
        ))}
        <a
          className="btn btn-ghost jnav-cta"
          href={PROFILE.socials.github}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub ↗
        </a>
      </div>

      <button className="jnav-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <div className="jnav-mobile">
          {WAYPOINTS.map((w) => (
            <button
              key={w.id}
              className={`jnav-link mono${active === w.id ? ' active' : ''}`}
              onClick={() => go(w.id)}
            >
              <span className="wp-no">{String(WAYPOINTS.indexOf(w)).padStart(2, '0')}</span> {w.nav}
              <span className="jnav-alt altitude">{w.altitude}</span>
            </button>
          ))}
          <a className="btn btn-ghost" href={PROFILE.socials.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
      )}
    </nav>
  );
}

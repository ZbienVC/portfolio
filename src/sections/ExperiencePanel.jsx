import { useState } from 'react';
import { EXPERIENCE, PROFILE } from '../content/portfolio.js';
import { SectionShell } from './common.jsx';

export default function ExperiencePanel({ waypoint }) {
  const [open, setOpen] = useState(0);
  return (
    <SectionShell
      no="04"
      label={waypoint?.title || 'The Ascent'}
      altitude={waypoint?.altitude || '1,740 m'}
      wide
      title={<>Where I've <span className="serif-italic">been</span></>}
      intro="Every marker on the trail up — markets, surveillance, operations, building."
    >
      <div className="exp-trail">
        {EXPERIENCE.map((exp, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`exp-station glass reveal${isOpen ? ' open' : ''}`}
              style={{ borderLeftColor: exp.color }}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <div className="exp-marker" style={{ background: exp.color, boxShadow: `0 0 14px ${exp.color}` }} />
              <div className="exp-row">
                <div className="exp-main">
                  <div className="exp-role">{exp.role}</div>
                  <div className="exp-meta">
                    <span className="exp-company" style={{ color: exp.color }}>{exp.company}</span>
                    <span className="exp-dot">·</span>
                    <span className="altitude">{exp.location}</span>
                  </div>
                </div>
                <div className="exp-right">
                  <span className="altitude">{exp.period}</span>
                  <span className={`exp-caret${isOpen ? ' up' : ''}`} style={{ color: isOpen ? exp.color : 'var(--snow-4)' }}>›</span>
                </div>
              </div>
              <div className={`exp-detail${isOpen ? ' show' : ''}`}>
                <ul>
                  {exp.highlights.map((h, j) => (
                    <li key={j}>
                      <span className="hl-arrow" style={{ color: exp.color }}>›</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="exp-cta reveal">
        <a className="btn btn-primary" href={PROFILE.resumeOnline} target="_blank" rel="noopener noreferrer">Resume online ↗</a>
        <a className="btn btn-ghost" href={PROFILE.resumePdf} target="_blank" rel="noopener noreferrer">Download PDF ↓</a>
      </div>
    </SectionShell>
  );
}

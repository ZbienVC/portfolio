import { PROFILE, ABOUT } from '../content/portfolio.js';
import { SectionShell } from './common.jsx';

function accentQuote(text, accents) {
  let parts = [text];
  accents.forEach((word) => {
    parts = parts.flatMap((p) =>
      typeof p !== 'string'
        ? [p]
        : p.split(word).flatMap((seg, i, arr) =>
            i < arr.length - 1 ? [seg, <em key={word + i} className="q-accent">{word}</em>] : [seg]
          )
    );
  });
  return parts;
}

export default function AboutPanel({ waypoint }) {
  return (
    <SectionShell
      no="02"
      label={waypoint?.title || 'The Overlook'}
      altitude={waypoint?.altitude || '2,610 m'}
      wide
      title={<>I want to know how things <span className="serif-italic">actually work</span></>}
    >
      <blockquote className="about-quote glass reveal d2">
        <span className="quote-mark serif-italic">“</span>
        <p>{accentQuote(ABOUT.quote, ABOUT.quoteAccents)}</p>
      </blockquote>

      <div className="about-grid">
        <div className="about-bio reveal">
          <div className="about-id">
            <div className="about-avatar">
              <img src={PROFILE.headshot} alt={PROFILE.name} />
            </div>
            <div>
              <div className="about-name">{PROFILE.name}</div>
              <div className="about-role mono">{PROFILE.title}</div>
              <div className="about-loc altitude">{PROFILE.location}</div>
            </div>
          </div>
          {ABOUT.paragraphs.map((p, i) => (
            <p key={i} className="about-para">{p}</p>
          ))}
          <div className="about-links">
            <a className="btn btn-primary" href={PROFILE.socials.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a className="btn btn-ghost" href={PROFILE.socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          </div>
        </div>

        <div className="about-traits">
          {ABOUT.traits.map((t, i) => (
            <div key={t.title} className={`trait glass glass-hover reveal d${Math.min(i + 1, 4)}`}>
              <div className="trait-no mono">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <div className="trait-title">{t.title}</div>
                <p className="trait-body">{t.body}</p>
              </div>
            </div>
          ))}
          <div className="edu glass reveal d4">
            <div className="edu-main">
              <div className="edu-degree">{ABOUT.education.degree}</div>
              <div className="edu-school">{ABOUT.education.school}</div>
            </div>
            <div className="edu-meta">
              <span className="chip">{ABOUT.education.cert}</span>
              <span className="altitude">{ABOUT.education.date}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

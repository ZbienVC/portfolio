import { useState } from 'react';
import { PROFILE, CONTACT } from '../content/portfolio.js';
import { SectionShell } from './common.jsx';
import { useMagnetic } from '../journey/hooks.js';

function IconGithub() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.5A10.5 10.5 0 0 0 1.5 12c0 4.64 3.01 8.57 7.18 9.96.53.1.72-.23.72-.5v-1.76c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.95-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.67-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.09-2.81-.11-.27-.47-1.34.1-2.8 0 0 .89-.28 2.91 1.07a10.1 10.1 0 0 1 5.3 0c2.02-1.35 2.9-1.07 2.9-1.07.58 1.46.22 2.53.11 2.8.68.73 1.09 1.66 1.09 2.81 0 4.02-2.46 4.9-4.8 5.16.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 22.5 12 10.5 10.5 0 0 0 12 1.5Z"/></svg>;
}
function IconLinkedin() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/></svg>;
}
function IconMail() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/></svg>;
}

export default function ContactPanel({ waypoint }) {
  const [copied, setCopied] = useState(false);
  const mag = useMagnetic(0.3);

  const copy = () => {
    navigator.clipboard?.writeText(PROFILE.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <SectionShell
      no="07"
      label={waypoint?.title || 'Trailhead'}
      altitude={waypoint?.altitude || '720 m'}
      title={<>Let's build something <span className="serif-italic">together</span></>}
      intro={CONTACT.body}
    >
      <div className="contact-links reveal d2">
        <a className="contact-link glass glass-hover" href={PROFILE.socials.github} target="_blank" rel="noopener noreferrer">
          <IconGithub /> GitHub
        </a>
        <a className="contact-link glass glass-hover" href={PROFILE.socials.linkedin} target="_blank" rel="noopener noreferrer">
          <IconLinkedin /> LinkedIn
        </a>
        <a className="contact-link glass glass-hover" href={`mailto:${PROFILE.email}`}>
          <IconMail /> Email
        </a>
        <button ref={mag} className={`contact-link copy${copied ? ' done' : ''}`} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy address'}
        </button>
      </div>

      <a className="btn btn-primary contact-cta reveal d3" href={`mailto:${PROFILE.email}`}>
        {PROFILE.email} →
      </a>

      <p className="contact-footer altitude reveal d4">{CONTACT.footer}</p>
    </SectionShell>
  );
}

import { SKILLS } from '../content/portfolio.js';
import { SectionShell } from './common.jsx';

export default function SkillsPanel({ waypoint }) {
  return (
    <SectionShell
      no="05"
      label={waypoint?.title || 'The Kit'}
      altitude={waypoint?.altitude || '1,390 m'}
      title={<>The tools in the <span className="serif-italic">pack</span></>}
      intro="What I build with — from React to on-chain data to the Bloomberg Terminal."
    >
      <div className="skills-rack reveal d2">
        {SKILLS.map((s, i) => (
          <span key={s} className="skill" style={{ transitionDelay: `${i * 34}ms` }}>
            <span className="skill-dot" />
            <span className="mono">{s}</span>
          </span>
        ))}
      </div>
    </SectionShell>
  );
}

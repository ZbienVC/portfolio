import { useState } from 'react';
import { PROJECTS, PROJECT_CATEGORIES, LIVE_COUNT } from '../content/portfolio.js';
import { SectionShell, ProjectMark } from './common.jsx';

function ProjectCard({ project, featured }) {
  return (
    <article className={`proj-card glass glass-hover${featured ? ' featured' : ''}`}>
      <div className="proj-accent" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.colorEnd})` }} />
      <div className="proj-inner">
        <div className="proj-top">
          <ProjectMark project={project} size={featured ? 54 : 44} />
          <div className="proj-titles">
            <div className="proj-name-row">
              <h3 className="proj-name">{project.name}</h3>
              <span className="status">
                <span className="dot" />
                {project.status === 'live' ? 'Live' : project.status === 'soon' ? 'Soon' : 'Building'}
              </span>
              {project.featured && <span className="flagship mono">FLAGSHIP</span>}
            </div>
            <p className="proj-tagline">{project.tagline}</p>
          </div>
        </div>

        <p className="proj-desc">{project.description}</p>

        {project.collection ? (
          <ul className="proj-collection">
            {project.collection.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ borderColor: `${project.color}33` }}>
                  <span className="pc-head">
                    <span className="pc-name" style={{ color: project.color }}>{s.name}</span>
                    <span className="pc-chain mono">{s.chain}</span>
                    <span className="pc-go">↗</span>
                  </span>
                  <span className="pc-blurb">{s.blurb}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="proj-highlights">
            {project.highlights.slice(0, featured ? 4 : 3).map((h) => (
              <li key={h}>
                <span className="hl-arrow" style={{ color: project.color }}>›</span>
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="proj-tags">
          {project.tags.slice(0, featured ? 6 : 4).map((t) => (
            <span key={t} className="chip" style={{ borderColor: `${project.color}40`, color: project.color, background: `${project.color}14` }}>
              {t}
            </span>
          ))}
        </div>

        <div className="proj-actions">
          {project.url && (
            <a className="btn btn-primary" href={project.url} target="_blank" rel="noopener noreferrer"
              style={{ background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, boxShadow: `0 8px 24px -8px ${project.color}88` }}>
              Visit ↗
            </a>
          )}
          {project.github && (
            <a className="btn btn-ghost" href={project.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProjectsPanel({ waypoint }) {
  const [tab, setTab] = useState('all');
  const list =
    tab === 'all' ? PROJECTS : PROJECTS.filter((p) => p.category?.includes(tab));
  const featured = list.filter((p) => p.featured);
  const rest = list.filter((p) => !p.featured);

  return (
    <SectionShell
      no="03"
      label={waypoint?.title || 'Basecamp'}
      altitude={waypoint?.altitude || '2,180 m'}
      wide
      title={<>The signals are <span className="serif-italic">lit</span></>}
      intro={`${LIVE_COUNT} projects live in production — every signal at basecamp is lit. Warm one up.`}
    >
      <div className="proj-tabs reveal d2">
        {PROJECT_CATEGORIES.map((c) => {
          const count = c.id === 'all' ? PROJECTS.length : PROJECTS.filter((p) => p.category?.includes(c.id)).length;
          return (
            <button
              key={c.id}
              className={`proj-tab mono${tab === c.id ? ' active' : ''}`}
              onClick={() => setTab(c.id)}
            >
              {c.label} <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="proj-grid">
        {featured.map((p) => (
          <ProjectCard key={p.id} project={p} featured />
        ))}
        {rest.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </SectionShell>
  );
}

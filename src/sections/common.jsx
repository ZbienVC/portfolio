import PlatoMark from '../PlatoMark.jsx';

// Two-letter mark from a name, used where a project has no logo asset.
export function mono(name) {
  const cleaned = String(name).replace(/[$]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return cleaned.slice(0, 2).toUpperCase();
}

// Consistent chrome for every waypoint: instrument eyebrow + altitude + display title.
export function SectionShell({ no, label, altitude, title, intro, wide, children }) {
  return (
    <div className={`section-shell${wide ? ' wide' : ''}`}>
      <header className="section-head">
        <div className="section-eyebrow reveal">
          <span className="eyebrow">
            <span className="wp-no mono">{no}</span> {label}
          </span>
          <span className="altitude">ALT {altitude}</span>
        </div>
        <h2 className="section-title display reveal d1">{title}</h2>
        {intro && <p className="section-intro reveal d2">{intro}</p>}
      </header>
      <div className="section-body">{children}</div>
    </div>
  );
}

// The lettermark / logo tile shown on each project card.
export function ProjectMark({ project, size = 46 }) {
  if (project.id === 'plato') {
    return (
      <div className="pmark" style={{ width: size, height: size, borderRadius: 10, overflow: 'hidden' }}>
        <PlatoMark size={size} rounded />
      </div>
    );
  }
  if (project.logo) {
    return (
      <div
        className="pmark"
        style={{
          width: size, height: size, borderRadius: 10, overflow: 'hidden',
          boxShadow: `0 8px 20px ${project.color}33`,
        }}
      >
        <img src={project.logo} alt="" width={size} height={size} style={{ objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div
      className="pmark"
      style={{
        width: size, height: size, borderRadius: 10,
        background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 20px ${project.color}33`,
        fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 500,
        fontSize: size * 0.44, color: '#1a130a', letterSpacing: '-0.02em',
      }}
    >
      {mono(project.name)}
    </div>
  );
}

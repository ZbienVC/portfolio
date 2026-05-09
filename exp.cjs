const fs = require('fs');

const code = fs.readFileSync('src/App.jsx', 'utf8');

const expIdx = code.indexOf('function ExperienceSection()');
const skillsIdx = code.indexOf('function SkillsSection()');

if (expIdx === -1 || skillsIdx === -1) {
  console.error('Could not find section boundaries');
  process.exit(1);
}

const newExpSection = `function ExperienceSection() {
  const [expanded, setExpanded] = React.useState(null);

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <section id="experience" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Background</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
          Where I've <span className="gradient-text">been</span>
        </h2>
      </div>

      <style>{\`
        .exp-card {
          border-radius: 18px;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
          border-left-width: 3px;
          border-left-style: solid;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        .exp-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.05);
        }
        .exp-card.expanded {
          transform: translateY(-2px);
        }
        .exp-highlights {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease, margin 0.25s ease;
          opacity: 0;
          margin-top: 0;
        }
        .exp-highlights.open {
          max-height: 400px;
          opacity: 1;
          margin-top: 14px;
        }
        @media (min-width: 768px) {
          .exp-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            align-items: start;
          }
          .exp-col-right {
            margin-top: 32px;
          }
        }
        @media (max-width: 767px) {
          .exp-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .exp-col-right { margin-top: 0; }
        }
      \`}</style>

      <div className="exp-grid" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXPERIENCE.filter((_, i) => i % 2 === 0).map((exp, colIdx) => {
            const realIdx = colIdx * 2;
            const isOpen = expanded === realIdx;
            return (
              <div key={realIdx} onClick={() => toggle(realIdx)}
                className={\`exp-card \${isOpen ? 'expanded' : ''}\`}
                style={{ borderLeftColor: exp.color, boxShadow: isOpen ? \`0 8px 32px \${exp.color}20, -2px 0 0 \${exp.color}\` : \`0 2px 12px rgba(0,0,0,0.2)\` }}>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: \`linear-gradient(to left, \${exp.color}06, transparent)\`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#f0f4ff', lineHeight: 1.3, marginBottom: 4 }}>{exp.role}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: exp.color }}>{exp.company}</span>
                      <span style={{ color: '#2a3255', fontSize: 11 }}>·</span>
                      <span style={{ color: '#4a5580', fontSize: 11 }}>{exp.location}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#4a5580', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{exp.period}</span>
                    <span style={{ fontSize: 12, color: isOpen ? exp.color : '#2a3255', transition: 'all 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>›</span>
                  </div>
                </div>
                <div className={\`exp-highlights \${isOpen ? 'open' : ''}\`}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exp.highlights.map((h, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6b7db3', lineHeight: 1.55 }}>
                        <span style={{ color: exp.color, flexShrink: 0, fontWeight: 700 }}>\u203a</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column — offset */}
        <div className="exp-col-right" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXPERIENCE.filter((_, i) => i % 2 === 1).map((exp, colIdx) => {
            const realIdx = colIdx * 2 + 1;
            const isOpen = expanded === realIdx;
            return (
              <div key={realIdx} onClick={() => toggle(realIdx)}
                className={\`exp-card \${isOpen ? 'expanded' : ''}\`}
                style={{ borderLeftColor: exp.color, boxShadow: isOpen ? \`0 8px 32px \${exp.color}20, -2px 0 0 \${exp.color}\` : \`0 2px 12px rgba(0,0,0,0.2)\` }}>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: \`linear-gradient(to left, \${exp.color}06, transparent)\`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#f0f4ff', lineHeight: 1.3, marginBottom: 4 }}>{exp.role}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: exp.color }}>{exp.company}</span>
                      <span style={{ color: '#2a3255', fontSize: 11 }}>·</span>
                      <span style={{ color: '#4a5580', fontSize: 11 }}>{exp.location}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#4a5580', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{exp.period}</span>
                    <span style={{ fontSize: 12, color: isOpen ? exp.color : '#2a3255', transition: 'all 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>›</span>
                  </div>
                </div>
                <div className={\`exp-highlights \${isOpen ? 'open' : ''}\`}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exp.highlights.map((h, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#6b7db3', lineHeight: 1.55 }}>
                        <span style={{ color: exp.color, flexShrink: 0, fontWeight: 700 }}>\u203a</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Education */}
      <div style={{ maxWidth: 900, margin: '20px auto 0' }}>
        <div className="glass" style={{ borderRadius: 18, padding: '18px 24px', borderLeft: '3px solid #f59e0b', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28 }}>\u{1F393}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#f0f4ff', marginBottom: 2 }}>B.S. Finance \u2014 Business Analytics</div>
            <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Rutgers University, New Brunswick</div>
            <span className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)', fontSize: 11 }}>SQL Cert \u2014 UC Davis</span>
          </div>
          <div style={{ color: '#4a5580', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>Dec 2022</div>
        </div>
      </div>

      {/* Resume CTA */}
      <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://bold.pro/my/zachary-bienstock/354r" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14 }}>
          View Resume Online \u2197
        </a>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 14 }}>
          Download PDF \u2193
        </a>
      </div>
    </section>
  );
}

`;

const newCode = code.slice(0, expIdx) + newExpSection + code.slice(skillsIdx);
fs.writeFileSync('src/App.jsx', newCode, 'utf8');
console.log('Done. Has React.useState:', newCode.includes('React.useState'));
console.log('Has exp-grid:', newCode.includes('exp-grid'));


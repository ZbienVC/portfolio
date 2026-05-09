const fs = require('fs');
const https = require('https');

// Fetch the last known clean file from GitHub
const opts = {
  hostname: 'api.github.com',
  path: '/repos/ZbienVC/portfolio/contents/src/App.jsx?ref=bdf61f8',
  headers: {
    'Authorization': 'token GITHUB_TOKEN_REDACTED',
    'User-Agent': 'openclaw',
    'Accept': 'application/vnd.github.v3+json'
  }
};

https.get(opts, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    let code = Buffer.from(JSON.parse(b).content, 'base64').toString('utf8');
    console.log('Base file lines:', code.split('\n').length);
    console.log('First line:', code.split('\n')[0]);
    
    // ── 1. Add GIGATON + WayFound before staywestpalm ──
    const gigatonProject = `  {
    id: 'gigaton',
    name: '$GIGATON',
    tagline: 'Gigachad on TON \u2014 Memecoin Website',
    description: 'A fully custom memecoin landing site for $GIGATON on the TON blockchain. TON-blue design, Gigachad meme gallery, live DexScreener chart, scrolling ticker, and tokenomics.',
    status: 'live',
    url: 'https://gigaton.pro',
    github: 'https://github.com/ZbienVC/gigaton-token',
    color: '#0088CC',
    colorEnd: '#005F8F',
    tagClass: 'tag-blue',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'TON'],
    emoji: '\u{1F537}',
    highlights: ['TON blue design system', 'Live DexScreener chart', 'Gigachad meme vault', 'Scrolling ticker + tokenomics'],
  },
  {
    id: 'wayfound',
    name: 'WayFound',
    tagline: 'AI-Powered Travel Concierge',
    description: 'Describe your trip in plain language and get scored, ranked hotel results instantly. Claude parses preferences, Amadeus pulls live inventory, Stripe handles checkout.',
    status: 'live',
    url: 'https://wayfound.vercel.app',
    github: 'https://github.com/ZbienVC/wayfound',
    color: '#c9a84c',
    colorEnd: '#e8c96a',
    tagClass: '',
    tags: ['Next.js', 'tRPC', 'Claude AI', 'Amadeus', 'Stripe'],
    emoji: '\u2708\uFE0F',
    highlights: ['AI preference parsing', 'Live hotel inventory', 'Real Stripe checkout', 'Zero-key demo mode'],
  },
`;
    code = code.replace("  {\n    id: 'staywestpalm',", gigatonProject + "  {\n    id: 'staywestpalm',");

    // ── 2. Fix hero stats ──
    code = code.replace(
      "{ num: '$1B+', label: 'Capital Raises Supported' },\n            { num: '80%', label: 'Manual Work Automated' },\n            { num: '$1M+', label: 'Crypto Launches Advised' },",
      "{ num: '9', label: 'Live in Production' },\n            { num: '3+', label: 'Currently Building' },\n            { num: '\u221E', label: 'Problems Left to Solve' },"
    );

    // ── 3. Replace ProjectsSection ──
    const projIdx = code.indexOf('function ProjectsSection()');
    const expIdx = code.indexOf('function ExperienceSection()');
    if (projIdx === -1 || expIdx === -1) {
      console.error('Could not find section boundaries');
      process.exit(1);
    }

    const newProjectsSection = `function ProjectsSection() {
  const CATS = {
    all: PROJECTS,
    ai: PROJECTS.filter(p => ['dipper','careeva','plato','reflect','wayfound'].includes(p.id)),
    crypto: PROJECTS.filter(p => ['splash','gigaton','omo'].includes(p.id)),
    web: PROJECTS.filter(p => ['staywestpalm','reflect','omo','gigaton'].includes(p.id)),
  };
  const TABS = [
    { id:'all',    label:'All Projects',  count: PROJECTS.length },
    { id:'ai',     label:'AI & Products', count: CATS.ai.length },
    { id:'crypto', label:'Crypto & Web3', count: CATS.crypto.length },
    { id:'web',    label:'Web & Sites',   count: CATS.web.length },
  ];

  const [activeTab, setActiveTab] = useState('all');
  const [fade, setFade] = useState(false);

  const switchTab = (id) => {
    if (id === activeTab) return;
    setFade(true);
    setTimeout(() => { setActiveTab(id); setFade(false); }, 150);
  };

  const projects = CATS[activeTab] || PROJECTS;
  const featured = projects.slice(0, 2);
  const compact = projects.slice(2);
  const activeTabObj = TABS.find(t => t.id === activeTab);

  const statusCfg = (s) => s === 'live'
    ? { bg:'rgba(16,217,160,0.12)', color:'#10d9a0', border:'rgba(16,217,160,0.25)', label:'Live' }
    : s === 'soon'
    ? { bg:'rgba(139,92,246,0.12)', color:'#8b5cf6', border:'rgba(139,92,246,0.25)', label:'Soon' }
    : { bg:'rgba(79,157,235,0.12)', color:'#4f9deb', border:'rgba(79,157,235,0.25)', label:'Building' };

  return (
    <section id="projects" style={{ padding: '88px 24px 72px', background: 'rgba(15,22,41,0.3)' }}>
      <style>{\`
        @keyframes pf { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .pf { animation: pf 0.28s ease forwards; }
        .tab-btn:hover { opacity: 0.85; }
      \`}</style>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>

        <div style={{ textAlign:'center', marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>What I've Built</p>
          <h2 style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:900, letterSpacing:'-1px', marginBottom:8 }}>
            Projects <span className="gradient-text">in the wild</span>
          </h2>
          <p style={{ color:'#4a5580', fontSize:14, fontFamily:"'JetBrains Mono',monospace" }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} \u2014 {activeTabObj?.label}
          </p>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
          {TABS.map(tab => {
            const on = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => switchTab(tab.id)} className="tab-btn"
                style={{ padding:'10px 22px', borderRadius:100, fontSize:13, fontWeight:700, cursor:'pointer',
                  border: \`1px solid \${on ? 'rgba(16,217,160,0.35)' : 'rgba(255,255,255,0.08)'}\`,
                  background: on ? 'rgba(16,217,160,0.1)' : 'rgba(255,255,255,0.04)',
                  color: on ? '#10d9a0' : '#6b7db3',
                  display:'flex', alignItems:'center', gap:8,
                  boxShadow: on ? '0 0 20px rgba(16,217,160,0.1)' : 'none',
                  transition:'all 0.2s' }}>
                <span>{tab.label}</span>
                <span style={{ padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:700,
                  background: on ? 'rgba(16,217,160,0.15)' : 'rgba(255,255,255,0.06)',
                  color: on ? '#10d9a0' : '#4a5580' }}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div key={activeTab} className="pf" style={{ opacity: fade ? 0 : 1, transition:'opacity 0.15s' }}>
          {featured.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,460px),1fr))', gap:20, marginBottom: compact.length ? 20 : 0 }}>
              {featured.map((p, i) => {
                const sc = statusCfg(p.status);
                return (
                  <div key={p.id} className="glass" style={{ borderRadius:22, overflow:'hidden', transition:'all 0.3s',
                    animation:\`pf 0.3s ease \${i*60}ms both\`,
                    border:'1px solid rgba(255,255,255,0.07)',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ height:3, background:\`linear-gradient(90deg,\${p.color},\${p.colorEnd})\` }} />
                    <div style={{ padding:'26px 26px 24px', display:'flex', flexDirection:'column', gap:16 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                        <div style={{ width:54, height:54, borderRadius:16, background:\`linear-gradient(135deg,\${p.color},\${p.colorEnd})\`,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0,
                          boxShadow:\`0 8px 20px \${p.color}40\` }}>{p.emoji}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:5 }}>
                            <h3 style={{ fontWeight:900, fontSize:22, color:'#f0f4ff', margin:0, lineHeight:1.1 }}>{p.name}</h3>
                            <div style={{ padding:'3px 10px', borderRadius:100, fontSize:10, fontWeight:700,
                              textTransform:'uppercase', letterSpacing:1,
                              background:sc.bg, color:sc.color, border:\`1px solid \${sc.border}\`,
                              display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                              <span style={{ width:5, height:5, borderRadius:'50%', background:sc.color, display:'inline-block' }} />
                              {sc.label}
                            </div>
                          </div>
                          <p style={{ color:'#8b9cc8', fontSize:13, fontWeight:600, margin:0 }}>{p.tagline}</p>
                        </div>
                      </div>
                      <p style={{ color:'#6b7db3', fontSize:14, lineHeight:1.7, margin:0 }}>{p.description}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                        {p.highlights.slice(0,4).map(h => (
                          <div key={h} style={{ display:'flex', gap:7, fontSize:12, color:'#9fb0d9', lineHeight:1.45 }}>
                            <span style={{ color:p.color, fontWeight:700, flexShrink:0 }}>\u2192</span><span>{h}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {p.tags.slice(0,5).map(t => (
                          <span key={t} style={{ padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:600,
                            background:\`\${p.color}12\`, color:p.color, border:\`1px solid \${p.color}25\` }}>{t}</span>
                        ))}
                        {p.tags.length > 5 && (
                          <span style={{ padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:600,
                            background:'rgba(255,255,255,0.05)', color:'#8b9cc8', border:'1px solid rgba(255,255,255,0.1)' }}>
                            +{p.tags.length-5}
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700,
                              background:\`linear-gradient(135deg,\${p.color},\${p.colorEnd})\`,
                              color:'#fff', textDecoration:'none',
                              boxShadow:\`0 4px 14px \${p.color}30\` }}>
                            Visit Live \u2197
                          </a>
                        )}
                        {p.github && (
                          <a href={p.github} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700,
                              background:'rgba(255,255,255,0.05)', color:'#8b9cc8',
                              border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none' }}>
                            GitHub \u2197
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {compact.length > 0 && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:12, margin:'8px 0 16px' }}>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }} />
                <span style={{ fontSize:11, color:'#2a3255', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:2, whiteSpace:'nowrap' }}>More Projects</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap:14 }}>
                {compact.map((p, i) => {
                  const sc = statusCfg(p.status);
                  return (
                    <div key={p.id} className="glass" style={{ borderRadius:18, overflow:'hidden',
                      transition:'all 0.25s', animation:\`pf 0.3s ease \${(i+2)*60}ms both\` }}>
                      <div style={{ height:2, background:\`linear-gradient(90deg,\${p.color},\${p.colorEnd})\` }} />
                      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:11 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                            background:\`linear-gradient(135deg,\${p.color},\${p.colorEnd})\`,
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{p.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                              <span style={{ fontWeight:800, fontSize:15, color:'#f0f4ff' }}>{p.name}</span>
                              <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                                color:sc.color, letterSpacing:0.5 }}>\u25CF {sc.label}</span>
                            </div>
                            <p style={{ color:'#6b7db3', fontSize:12, margin:0, lineHeight:1.4, marginTop:2 }}>{p.tagline}</p>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {p.tags.slice(0,3).map(t => (
                            <span key={t} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600,
                              background:\`\${p.color}10\`, color:p.color, border:\`1px solid \${p.color}20\` }}>{t}</span>
                          ))}
                          {p.tags.length > 3 && (
                            <span style={{ padding:'3px 8px', borderRadius:6, fontSize:10,
                              color:'#4a5580', background:'rgba(255,255,255,0.04)',
                              border:'1px solid rgba(255,255,255,0.08)' }}>+{p.tags.length-3}</span>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              style={{ padding:'7px 14px', borderRadius:8, fontSize:11, fontWeight:700,
                                background:\`linear-gradient(135deg,\${p.color},\${p.colorEnd})\`,
                                color:'#fff', textDecoration:'none' }}>Visit \u2197</a>
                          )}
                          {p.github && (
                            <a href={p.github} target="_blank" rel="noopener noreferrer"
                              style={{ padding:'7px 14px', borderRadius:8, fontSize:11, fontWeight:600,
                                background:'rgba(255,255,255,0.05)', color:'#6b7db3',
                                border:'1px solid rgba(255,255,255,0.08)', textDecoration:'none' }}>GitHub</a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:40 }}>
          <div className="glass" style={{ display:'inline-flex', alignItems:'center', gap:12,
            padding:'12px 24px', borderRadius:100, fontSize:13, color:'#6b7db3' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#8b5cf6',
              display:'inline-block', animation:'pulse 2s infinite' }} />
            More projects shipping soon
          </div>
        </div>
      </div>
    </section>
  );
}

`;

    code = code.slice(0, projIdx) + newProjectsSection + code.slice(expIdx);

    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log('Done. Lines:', code.split('\n').length);
    console.log('Has gigaton:', code.includes("id: 'gigaton'"));
    console.log('Has 9 live:', code.includes("'9', label: 'Live in Production'"));
    console.log('Has tabbed:', code.includes('CATS[activeTab]'));
    console.log('Emoji check plato:', code.match(/emoji: '.*?'/m)?.[0]);
  });
});


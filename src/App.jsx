import { useState, useEffect, useRef } from 'react';
import './index.css';

// ── Data ──────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: 'plato',
    name: 'Plato',
    tagline: 'AI-Powered Meal Planning & Nutrition',
    description: 'A full-stack nutrition coaching app that generates personalized meal plans, tracks macros, features a restaurant menu browser, recipe book, and AI-assisted food logging.',
    status: 'live',
    url: 'https://eatplato.app',
    github: 'https://github.com/ZbienVC/plato',
    color: '#10d9a0',
    colorEnd: '#059669',
    tagClass: '',
    tags: ['React', 'Vite', 'Tailwind', 'Nutrition API', 'AI'],
    emoji: '🥗',
    highlights: ['Personalized macro targets', 'Restaurant Mode (10+ chains)', 'Recipe Book with real photos', 'Voice food logging'],
  },
  {
    id: 'dipper',
    name: 'DipperAI',
    tagline: 'AI Agent Builder Platform',
    description: 'A subscription-based platform to build, customize, and deploy AI agents across Telegram, Discord, SMS, and the web. Multi-model support, no-code agent builder, built-in analytics.',
    status: 'soon',
    url: null,
    github: 'https://github.com/ZbienVC/dipper-ai',
    color: '#8b5cf6',
    colorEnd: '#6366f1',
    tagClass: 'tag-purple',
    tags: ['TypeScript', 'Node.js', 'Stripe', 'Twilio', 'Multi-LLM'],
    emoji: '🤖',
    highlights: ['Build agents in minutes', 'Deploy to Telegram, Discord, SMS', 'Subscription monetization model', 'Multi-model: Claude, GPT-4, Gemini'],
  },
  {
    id: 'splash',
    name: 'Splash Signal',
    tagline: 'Crypto Intelligence Dashboard',
    description: 'A real-time crypto alpha-hunting dashboard with live token feeds, risk scoring, whale tracking, narrative intelligence, and DeFi analytics — powered by on-chain data.',
    status: 'building',
    url: null,
    github: 'https://github.com/ZbienVC/splash-signal',
    color: '#4f9deb',
    colorEnd: '#6366f1',
    tagClass: 'tag-blue',
    tags: ['TypeScript', 'Node.js', 'WebSocket', 'DeFi APIs', 'SQLite'],
    emoji: '📡',
    highlights: ['Live on-chain token feeds', 'AI-powered narrative scoring', 'Whale wallet tracking', 'Multi-DEX analytics'],
  },
];

const SKILLS = [
  { label: 'React / Vite', icon: '⚛️' },
  { label: 'TypeScript', icon: '📘' },
  { label: 'Node.js', icon: '🟢' },
  { label: 'Tailwind CSS', icon: '🎨' },
  { label: 'SQL / SQLite', icon: '🗄️' },
  { label: 'REST & WebSockets', icon: '🔌' },
  { label: 'AI / LLM APIs', icon: '🤖' },
  { label: 'DeFi / Web3', icon: '🔗' },
  { label: 'Python', icon: '🐍' },
  { label: 'Figma', icon: '🎨' },
  { label: 'Bloomberg Terminal', icon: '📊' },
  { label: 'Vercel / Railway', icon: '🚀' },
  { label: 'Advanced Excel', icon: '📈' },
  { label: 'Git / GitHub', icon: '🐙' },
];

const EXPERIENCE = [
  {
    role: 'Web3 Project Advisor',
    company: 'Independent / Crypto Projects',
    period: 'Dec 2024 \u2013 Present',
    location: 'Remote',
    color: '#f59e0b',
    highlights: [
      'Advise early-stage Web3 projects on token design, positioning, marketing strategy, and community growth',
      'Guide go-to-market strategies and token launches reaching $1M+ market capitalization',
      'Provide insights on crypto market dynamics, narrative positioning, and digital community engagement',
    ],
  },
  {
    role: 'Savings Analyst & Sales Engineer',
    company: 'Grapevine',
    period: 'Feb 2024 \u2013 Oct 2025',
    location: 'New York, NY',
    color: '#10d9a0',
    highlights: [
      'Built automated Excel reporting systems and Figma dashboards, reducing manual reporting by 80%+',
      'Analyzed tens of thousands of product groups — generated 20–85% cost savings, ranging from tens of thousands to millions annually',
      'Resolved 50+ weekly supply backorders; assisted with client onboarding, vendor integration, and system setup',
    ],
  },
  {
    role: 'Operations & Marketing Coordinator',
    company: 'Reflect Medical & Cosmetic Center',
    period: 'Jul 2023 \u2013 Present',
    location: 'Hawthorne, NJ',
    color: '#ec4899',
    highlights: [
      'Managed financial workflows in QuickBooks: transaction entry, reconciliation, expense tracking',
      'Oversaw inventory procurement and vendor coordination for consistent medical supply availability',
      'Designed marketing materials, social media assets, and promotional graphics using Canva',
    ],
  },
  {
    role: 'Financial Data Analyst — Surveillance & Threat Detection',
    company: 'Bloomberg LP',
    period: 'Mar 2023 \u2013 Feb 2024',
    location: 'Remote',
    color: '#4f9deb',
    highlights: [
      'Analyzed large financial datasets to identify trends and support ML surveillance models',
      'Evaluated derivatives activity — options, swaps, forwards — to validate structured financial data',
      'Collaborated with senior analysts to improve AI-based trade surveillance and threat detection systems',
    ],
  },
  {
    role: 'Investment Banking Intern',
    company: 'Cambridge Wilkinson',
    period: 'Feb 2022 \u2013 Feb 2023',
    location: 'New York, NY',
    color: '#8b5cf6',
    highlights: [
      'Researched middle-market companies to support debt and equity capital raises ($25M – $1B)',
      'Built detailed target lists of executives and financial metrics for active deal sourcing',
      'Supported investor presentations and discussions with institutional clients',
    ],
  },
  {
    role: 'IPO Markets Intern',
    company: 'Prior2IPO Investments',
    period: 'May 2021 \u2013 Aug 2021',
    location: 'Sparta, NJ',
    color: '#6366f1',
    highlights: [
      'Connected accredited investors with Pre-IPO investment funds and deal opportunities',
      'Conducted outreach to prospective investors and gained exposure to private equity deal flow',
    ],
  },
  {
    role: 'Computer Technician & Builder',
    company: 'Freelance',
    period: 'May 2019 \u2013 Aug 2024',
    location: 'Remote',
    color: '#64748b',
    highlights: [
      'Built and sold 50+ custom desktop computers through eBay',
      'Diagnosed and repaired hardware/software issues; performed upgrades and performance optimization',
    ],
  },
];

// ── Components ─────────────────────────────────────────────────────────────────

function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '16px 24px',
      background: scrolled ? 'rgba(4,8,16,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <a href="#hero" style={{ textDecoration: 'none' }}>
        <span style={{ fontWeight: 900, fontSize: '18px', background: 'linear-gradient(135deg, #10d9a0, #4f9deb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ZB</span>
      </a>
      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {['About', 'Projects', 'Experience', 'Skills', 'Life', 'Contact'].map(s => (
          <a key={s} href={`#${s.toLowerCase()}`} className="nav-link">{s}</a>
        ))}
        <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}

function HeroSection() {
  const [typed, setTyped] = useState('');
  const titles = ['Builder', 'Developer', 'Founder', 'Creator'];
  const [titleIdx, setTitleIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = titles[titleIdx];
    let timeout;
    if (!isDeleting && typed.length < current.length) {
      timeout = setTimeout(() => setTyped(current.slice(0, typed.length + 1)), 100);
    } else if (!isDeleting && typed.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typed.length > 0) {
      timeout = setTimeout(() => setTyped(typed.slice(0, -1)), 60);
    } else if (isDeleting && typed.length === 0) {
      setIsDeleting(false);
      setTitleIdx((titleIdx + 1) % titles.length);
    }
    return () => clearTimeout(timeout);
  }, [typed, isDeleting, titleIdx]);

  return (
    <section id="hero" className="mesh-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px', textAlign: 'center', position: 'relative' }}>
      {/* Floating orbs */}
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,217,160,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,157,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
        {/* Headshot avatar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #10d9a0, #4f9deb, #8b5cf6)', padding: 3, margin: '0 auto', boxShadow: '0 0 40px rgba(16,217,160,0.2)' }}>
            <img src="/headshot.jpg" alt="Zach Bienstock" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
          </div>
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(16,217,160,0.08)', border: '1px solid rgba(16,217,160,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 32, fontSize: 13, color: '#10d9a0', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10d9a0', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Available for opportunities
        </div>

        {/* Name */}
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 16, letterSpacing: '-2px' }}>
          <span style={{ color: '#f0f4ff' }}>Zach</span>{' '}
          <span className="gradient-text">Bienstock</span>
        </h1>

        {/* Typewriter */}
        <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700, color: '#8b9cc8', marginBottom: 24, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4f9deb' }}>{'>'}</span>
          <span style={{ marginLeft: 12, color: '#f0f4ff' }}>{typed}</span>
          <span style={{ width: 2, height: 28, background: '#10d9a0', marginLeft: 2, animation: 'pulse 1s step-end infinite' }} />
        </div>

        {/* Bio */}
        <p style={{ fontSize: 18, color: '#6b7db3', lineHeight: 1.7, maxWidth: 580, margin: '0 auto 40px', fontWeight: 400 }}>
          I don't just want to know how things work — I want to make them <span style={{ color: '#f0f4ff', fontWeight: 600 }}>work better</span>. Finance background from <span style={{ color: '#4f9deb', fontWeight: 600 }}>Bloomberg</span> &amp; <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Investment Banking</span>, now building at the intersection of <span style={{ color: '#10d9a0', fontWeight: 600 }}>data</span>, <span style={{ color: '#4f9deb', fontWeight: 600 }}>product</span>, and <span style={{ color: '#8b5cf6', fontWeight: 600 }}>AI</span>.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#projects" className="btn-primary" style={{ fontSize: 15 }}>
            View My Work ↓
          </a>
          <a href="https://bold.pro/my/zachary-bienstock/354r" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 15 }}>
            Resume ↗
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {[
            { num: '3', label: 'Products in Development' },
            { num: '1', label: 'Live in Production' },
            { num: '∞', label: 'Problems Left to Solve' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #10d9a0, #4f9deb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.num}</div>
              <div style={{ fontSize: 12, color: '#4a5580', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: '#4a5580', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Scroll</span>
        <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #4a5580, transparent)' }} />
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>About Me</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', maxWidth: 700, margin: '0 auto' }}>
          I want to understand how things<br />
          <span className="gradient-text">actually work.</span>
        </h2>
      </div>

      {/* Quote callout */}
      <div className="glass" style={{ borderRadius: 20, padding: '28px 36px', maxWidth: 780, margin: '0 auto 64px', borderLeft: '3px solid #10d9a0', position: 'relative' }}>
        <div style={{ fontSize: 48, color: '#10d9a0', opacity: 0.15, position: 'absolute', top: 16, left: 20, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
        <p style={{ color: '#c4d0f5', fontSize: 18, lineHeight: 1.7, fontStyle: 'italic', fontWeight: 400, paddingLeft: 8 }}>
          I naturally operate at the intersection of <span style={{ color: '#10d9a0', fontStyle: 'normal', fontWeight: 700 }}>data</span>, <span style={{ color: '#4f9deb', fontStyle: 'normal', fontWeight: 700 }}>creativity</span>, and <span style={{ color: '#8b5cf6', fontStyle: 'normal', fontWeight: 700 }}>strategy</span>. I'm at my best when I can take something complex or messy and turn it into something clearer, more usable, and more thoughtful.
        </p>
      </div>

      {/* Two column bio + traits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>
        <div>
          {/* Headshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #10d9a0, #4f9deb, #8b5cf6)', padding: 3 }}>
                <img src="/headshot.jpg" alt="Zach Bienstock" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: '#10d9a0', border: '2px solid #040810' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#f0f4ff' }}>Zach Bienstock</div>
              <div style={{ color: '#10d9a0', fontSize: 13, fontWeight: 600 }}>Builder · Analyst · Developer</div>
              <div style={{ color: '#4a5580', fontSize: 12, marginTop: 2 }}>Hawthorne, NJ</div>
            </div>
          </div>
          <p style={{ color: '#6b7db3', lineHeight: 1.85, fontSize: 15, marginBottom: 20 }}>
            Finance graduate from <span style={{ color: '#f0f4ff', fontWeight: 600 }}>Rutgers</span> (Dean's List, 3.58 GPA) who spent time analyzing derivatives at <span style={{ color: '#4f9deb', fontWeight: 600 }}>Bloomberg LP</span> and supporting $25M–$1B capital raises at <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Cambridge Wilkinson</span> before turning full attention to building software.
          </p>
          <p style={{ color: '#6b7db3', lineHeight: 1.85, fontSize: 15, marginBottom: 20 }}>
            That curiosity has been with me since long before formal roles — buying and selling online, building and fixing computers, learning how value is created and exchanged. I tend to think in systems rather than tasks. I ask where information comes from, what it represents in the real world, and how it could be better.
          </p>
          <p style={{ color: '#6b7db3', lineHeight: 1.85, fontSize: 15, marginBottom: 32 }}>
            Outside of work: deeply into <span style={{ color: '#f0f4ff', fontWeight: 600 }}>crypto mechanics</span> and incentive design, <span style={{ color: '#f0f4ff', fontWeight: 600 }}>cognitive science</span> and how attention works, and <span style={{ color: '#f0f4ff', fontWeight: 600 }}>snowboarding</span> — specifically the technical side of board design and performance optimization. That same mindset shows up in my work.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14 }}>GitHub ↗</a>
            <a href="https://www.linkedin.com/in/zach-bienstock" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 14 }}>LinkedIn ↗</a>
          </div>
        </div>

        {/* Traits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { emoji: '🔬', title: 'Systems Thinker', desc: 'I ask where data comes from, what it represents, and how confident we should be in it. Numbers should explain reality, not just look correct.' },
            { emoji: '🏗️', title: 'Builder by Nature', desc: 'Long before formal roles — repairing computers, selling online, advising crypto launches. I learn by doing and care about ownership.' },
            { emoji: '⚡', title: 'Impact Over Process', desc: 'I don\'t enjoy analysis that lives in isolation. Every insight should turn into a decision, a better experience, or a smarter system.' },
            { emoji: '🎯', title: 'Precision & Iteration', desc: 'Drawn to the technical details. Snowboard geometry, ML model validation, product design — I care about why things work, not just that they do.' },
          ].map(v => (
            <div key={v.title} className="glass glass-hover" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{v.emoji}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#f0f4ff', marginBottom: 4 }}>{v.title}</div>
                <div style={{ color: '#6b7db3', fontSize: 13, lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="glass"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 24, overflow: 'hidden', cursor: 'default',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered ? `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${project.color}22` : '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        borderColor: hovered ? `${project.color}22` : 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${project.color}, ${project.colorEnd})` }} />

      {/* Header */}
      <div style={{ padding: '28px 28px 20px', background: `linear-gradient(135deg, ${project.color}0a, ${project.colorEnd}06)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `0 8px 20px ${project.color}33` }}>
              {project.emoji}
            </div>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: 22, color: '#f0f4ff', marginBottom: 2 }}>{project.name}</h3>
              <p style={{ color: '#6b7db3', fontSize: 13, fontWeight: 500 }}>{project.tagline}</p>
            </div>
          </div>
          {/* Status badge */}
          {(() => {
            const cfg = project.status === 'live'
              ? { bg: 'rgba(16,217,160,0.12)', color: '#10d9a0', border: 'rgba(16,217,160,0.25)', label: 'Live' }
              : project.status === 'soon'
              ? { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.25)', label: 'Coming Soon' }
              : { bg: 'rgba(79,157,235,0.12)', color: '#4f9deb', border: 'rgba(79,157,235,0.25)', label: 'Building' };
            return (
              <div style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                {cfg.label}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 28px 28px' }}>
        <p style={{ color: '#6b7db3', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{project.description}</p>

        {/* Highlights */}
        <div style={{ marginBottom: 20 }}>
          {project.highlights.map(h => (
            <div key={h} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: '#8b9cc8' }}>
              <span style={{ color: project.color, fontWeight: 700, flexShrink: 0 }}>→</span> {h}
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
          {project.tags.map(t => (
            <span key={t} className={`tag ${project.tagClass}`} style={{ background: `${project.color}12`, color: project.color, borderColor: `${project.color}25` }}>{t}</span>
          ))}
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 10 }}>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 13, padding: '10px 20px', background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, boxShadow: `0 4px 15px ${project.color}30` }}>
              Visit Site ↗
            </a>
          )}
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 13, padding: '10px 20px' }}>
            GitHub ↗
          </a>
        </div>
      </div>
    </div>
  );
}

function ProjectsSection() {
  return (
    <section id="projects" style={{ padding: '100px 24px', background: 'rgba(15,22,41,0.3)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>What I've Built</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
            Projects <span className="gradient-text">in the wild</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
          {PROJECTS.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>

        {/* More coming */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <div className="glass" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 28px', borderRadius: 100, fontSize: 14, color: '#6b7db3' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            More projects coming soon — DipperAI and beyond
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  return (
    <section id="experience" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Background</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
          Where I've <span className="gradient-text">been</span>
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 780, margin: '0 auto' }}>
        {EXPERIENCE.map((exp, i) => (
          <div key={i} className="glass" style={{ borderRadius: 20, padding: '24px 28px', borderLeft: `3px solid ${exp.color}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: 17, color: '#f0f4ff' }}>{exp.role}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: exp.color }}>{exp.company}</span>
                <span style={{ color: '#2a3255', fontSize: 12 }}>·</span>
                <span style={{ color: '#4a5580', fontSize: 12 }}>{exp.location}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {exp.highlights.map((h, j) => (
                  <li key={j} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#6b7db3', lineHeight: 1.5 }}>
                    <span style={{ color: exp.color, flexShrink: 0, fontWeight: 700 }}>›</span> {h}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: '#4a5580', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>{exp.period}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Education */}
      <div style={{ maxWidth: 780, margin: '24px auto 0' }}>
        <div className="glass" style={{ borderRadius: 20, padding: '24px 28px', borderLeft: '3px solid #f59e0b', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 36 }}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#f0f4ff', marginBottom: 2 }}>B.S. Finance — Business Analytics Concentration</div>
            <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Rutgers University, New Brunswick</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>Dean's List</span>
              <span className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>GPA 3.58</span>
              <span className="tag" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>SQL Cert — UC Davis</span>
            </div>
          </div>
          <div style={{ color: '#4a5580', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>Dec 2022</div>
        </div>
      </div>

      {/* Resume CTA */}
      <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://bold.pro/my/zachary-bienstock/354r" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 15 }}>
          View Resume Online ↗
        </a>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 15 }}>
          Download PDF ↓
        </a>
      </div>
    </section>
  );
}

const LIFE_PHOTOS = [
  { src: '/life/photo1.jpeg', label: 'Living life' },
  { src: '/life/photo2.jpg',  label: 'Moments' },
  { src: '/life/photo3.jpeg', label: 'Adventures' },
  { src: '/life/photo4.jpeg', label: 'Vibes' },
  { src: '/life/photo5.jpeg', label: 'Good times' },
  { src: '/life/photo6.jpeg', label: 'The journey' },
  { src: '/life/photo7.jpg',  label: 'Life' },
];

function LifeSection() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const total = LIFE_PHOTOS.length;

  // Auto-rotate
  useEffect(() => {
    if (dragging) return;
    const t = setInterval(() => setActive(a => (a + 1) % total), 3500);
    return () => clearInterval(t);
  }, [dragging, total]);

  const prev = () => setActive(a => (a - 1 + total) % total);
  const next = () => setActive(a => (a + 1) % total);

  // Touch/drag
  const onDragStart = (e) => { setDragging(true); setDragStart(e.clientX || e.touches?.[0]?.clientX || 0); };
  const onDragEnd = (e) => {
    const end = e.clientX || e.changedTouches?.[0]?.clientX || 0;
    const diff = dragStart - end;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    setDragging(false);
  };

  return (
    <section id="life" style={{ padding: '100px 24px', background: 'rgba(15,22,41,0.3)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Beyond the Work</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
            A slice of <span className="gradient-text">life</span>
          </h2>
        </div>

        {/* Stacked card carousel */}
        <div style={{ position: 'relative', height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
          onMouseDown={onDragStart} onMouseUp={onDragEnd}
          onTouchStart={onDragStart} onTouchEnd={onDragEnd}
        >
          {LIFE_PHOTOS.map((photo, i) => {
            const offset = (i - active + total) % total;
            const isActive = offset === 0;
            const isPrev = offset === total - 1;
            const isNext = offset === 1;
            const isVisible = isActive || isPrev || isNext || offset === 2 || offset === total - 2;

            let transform, zIndex, opacity, scale;
            if (isActive) {
              transform = 'translateX(0) rotate(0deg)';
              zIndex = 10; opacity = 1; scale = 1;
            } else if (isNext) {
              transform = 'translateX(160px) rotate(4deg)';
              zIndex = 8; opacity = 0.7; scale = 0.88;
            } else if (offset === 2) {
              transform = 'translateX(260px) rotate(7deg)';
              zIndex = 6; opacity = 0.35; scale = 0.78;
            } else if (isPrev) {
              transform = 'translateX(-160px) rotate(-4deg)';
              zIndex = 8; opacity = 0.7; scale = 0.88;
            } else if (offset === total - 2) {
              transform = 'translateX(-260px) rotate(-7deg)';
              zIndex = 6; opacity = 0.35; scale = 0.78;
            } else {
              transform = 'translateX(0)'; zIndex = 1; opacity = 0; scale = 0.7;
            }

            if (!isVisible) return null;

            return (
              <div key={i} onClick={() => !dragging && setActive(i)}
                style={{
                  position: 'absolute', width: 320, height: 420,
                  transform: `${transform} scale(${scale})`,
                  zIndex, opacity, transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                  cursor: isActive ? 'grab' : 'pointer',
                  borderRadius: 20, overflow: 'hidden',
                  boxShadow: isActive
                    ? '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,217,160,0.15)'
                    : '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                <img src={photo.src} alt={photo.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
                {isActive && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10d9a0' }} />
                      <span style={{ color: '#f0f4ff', fontSize: 13, fontWeight: 600 }}>{photo.label}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 40 }}>
          <button onClick={prev} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.background='rgba(16,217,160,0.15)'}
            onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.06)'}
          >←</button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {LIFE_PHOTOS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, background: i === active ? '#10d9a0' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
            ))}
          </div>

          <button onClick={next} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.background='rgba(16,217,160,0.15)'}
            onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.06)'}
          >→</button>
        </div>

        {/* Swipe hint */}
        <p style={{ textAlign: 'center', color: '#2a3255', fontSize: 12, marginTop: 16, fontFamily: "'JetBrains Mono', monospace" }}>
          drag or swipe to explore
        </p>
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section id="skills" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Tech Stack</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
          Tools I <span className="gradient-text">build with</span>
        </h2>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {SKILLS.map(s => (
          <div key={s.label} className="glass glass-hover" style={{ padding: '14px 22px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#c4d0f5' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactSection() {
  const [copied, setCopied] = useState(false);

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="contact" style={{ padding: '100px 24px', background: 'rgba(15,22,41,0.3)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Get In Touch</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 20 }}>
          Let's build something<br />
          <span className="gradient-text">together.</span>
        </h2>
        <p style={{ color: '#6b7db3', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
          Open to interesting opportunities, collabs, and conversations. Whether you have a project idea or just want to connect — reach out.
        </p>

        {/* Social links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>
            <span style={{ fontSize: 20 }}>🐙</span> GitHub
          </a>
          <a href="https://www.linkedin.com/in/zach-bienstock" target="_blank" rel="noopener noreferrer" className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>
            <span style={{ fontSize: 20 }}>💼</span> LinkedIn
          </a>
          <a href="mailto:Zbienstock@gmail.com" className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>
            <span style={{ fontSize: 20 }}>✉️</span> Email
          </a>
          <button onClick={() => copy('Zbienstock@gmail.com')} className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.06)', color: copied ? '#10d9a0' : '#8b9cc8', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'rgba(15,22,41,0.7)', backdropFilter: 'blur(20px)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 16 }}>{copied ? '✅' : '📋'}</span> {copied ? 'Copied!' : 'Copy Email'}
          </button>
        </div>

        {/* Footer note */}
        <p style={{ color: '#2a3255', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
          Built by Zach Bienstock · 2026
        </p>
      </div>
    </section>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#040810' }}>
      <Nav />
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ExperienceSection />
      <SkillsSection />
      <LifeSection />
      <ContactSection />
    </div>
  );
}

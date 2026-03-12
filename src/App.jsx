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
  { label: 'SQLite / SQL', icon: '🗄️' },
  { label: 'REST & WebSockets', icon: '🔌' },
  { label: 'AI / LLM APIs', icon: '🤖' },
  { label: 'DeFi / Web3', icon: '🔗' },
  { label: 'Vercel / Railway', icon: '🚀' },
  { label: 'Git / GitHub', icon: '🐙' },
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
        {['About', 'Projects', 'Skills', 'Contact'].map(s => (
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
        <p style={{ fontSize: 18, color: '#6b7db3', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px', fontWeight: 400 }}>
          I build products at the intersection of <span style={{ color: '#10d9a0', fontWeight: 600 }}>health tech</span>, <span style={{ color: '#4f9deb', fontWeight: 600 }}>crypto</span>, and <span style={{ color: '#8b5cf6', fontWeight: 600 }}>AI</span>. Turning ideas into live products, fast.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#projects" className="btn-primary" style={{ fontSize: 15 }}>
            View My Work ↓
          </a>
          <a href="#contact" className="btn-ghost" style={{ fontSize: 15 }}>
            Get in Touch
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {[
            { num: '3+', label: 'Apps in Production' },
            { num: '∞', label: 'Lines of Code' },
            { num: '24/7', label: 'Building Mode' },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
        <div>
          <p className="section-label" style={{ marginBottom: 16 }}>About Me</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 24 }}>
            I build things<br />
            <span className="gradient-text">people actually use.</span>
          </h2>
          <p style={{ color: '#6b7db3', lineHeight: 1.8, fontSize: 16, marginBottom: 20 }}>
            I'm Zach — a builder obsessed with shipping real products. My focus is on health tech, DeFi analytics, and AI-powered tools. I believe the best software is simple, fast, and feels inevitable once you use it.
          </p>
          <p style={{ color: '#6b7db3', lineHeight: 1.8, fontSize: 16, marginBottom: 32 }}>
            I work fast, think in systems, and care deeply about the user experience. Whether it's a nutrition app or a crypto dashboard, the goal is always the same: make something that works so well people can't stop using it.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14 }}>
              GitHub ↗
            </a>
            <a href="https://www.linkedin.com/in/zach-bienstock" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 14 }}>
              LinkedIn ↗
            </a>
          </div>
        </div>

        {/* Values cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { emoji: '⚡', title: 'Ship Fast', desc: 'Ideas die in planning. I bias toward building and iterating in production.' },
            { emoji: '🎯', title: 'User Obsessed', desc: 'Every feature earns its place. If users don\'t need it, it doesn\'t ship.' },
            { emoji: '🔗', title: 'Full-Stack', desc: 'From database schema to pixel-perfect UI — I own the whole thing.' },
          ].map(v => (
            <div key={v.title} className="glass glass-hover" style={{ borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{v.emoji}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#f0f4ff', marginBottom: 4 }}>{v.title}</div>
                <div style={{ color: '#6b7db3', fontSize: 14, lineHeight: 1.5 }}>{v.desc}</div>
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
          <div style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: project.status === 'live' ? 'rgba(16,217,160,0.12)' : 'rgba(79,157,235,0.12)', color: project.status === 'live' ? '#10d9a0' : '#4f9deb', border: `1px solid ${project.status === 'live' ? 'rgba(16,217,160,0.25)' : 'rgba(79,157,235,0.25)'}`, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: project.status === 'live' ? '#10d9a0' : '#4f9deb', display: 'inline-block' }} />
            {project.status === 'live' ? 'Live' : 'Building'}
          </div>
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
      <SkillsSection />
      <ContactSection />
    </div>
  );
}

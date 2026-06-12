import { useState, useEffect, useRef } from 'react';
import { useScrollReveal, useMagnetic, useParallax } from './useMotion';
import ChatWidget from './ChatWidget.jsx';
import './index.css';

// ── Data ──────────────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    id: 'splash',
    name: 'Splash Signal',
    tagline: 'Real-Time Crypto Alpha & Intelligence Engine',
    description: 'My flagship project - a real-time crypto intelligence platform that surfaces alpha before the crowd. Live token feeds, AI narrative scoring, whale & dev-wallet tracking, bundle detection, and risk analytics across multiple DEXs - delivered through a full dashboard plus an instant Telegram alerts bot.',
    status: 'live',
    url: 'https://splashsignal.xyz',
    github: 'https://github.com/ZbienVC/splash-signal',
    twitter: 'https://x.com/splashsignal',
    telegram: 'https://t.me/SplashSignalAlertsBot',
    color: '#4f9deb',
    colorEnd: '#8b5cf6',
    tagClass: 'tag-blue',
    tags: ['TypeScript', 'Node.js', 'WebSocket', 'DeFi APIs', 'On-Chain', 'AI'],
    emoji: '📡',
    featured: true,
    highlights: ['Live on-chain token feeds', 'AI-powered narrative scoring', 'Whale & dev-wallet tracking', 'Instant Telegram alert bot'],
    demoId: 'splash',
  },
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
    status: 'live',
    url: 'https://dipper-ai-production.up.railway.app',
    github: 'https://github.com/ZbienVC/dipper-ai',
    color: '#8b5cf6',
    colorEnd: '#6366f1',
    tagClass: 'tag-purple',
    tags: ['TypeScript', 'Node.js', 'Stripe', 'Twilio', 'Multi-LLM'],
    emoji: '🤖',
    highlights: ['Build agents in minutes', 'Deploy to Telegram, Discord, SMS', 'Subscription monetization model', 'Multi-model: Claude, GPT-4, Gemini'],
  },
  {
    id: 'careeva',
    name: 'Careeva',
    tagline: 'AI Job Search & Application Assistant',
    description: 'An intelligent job search platform that automates applications, optimizes resumes for specific jobs, generates personalized cover letters, and tracks your application pipeline - powered by multi-model AI.',
    status: 'live',
    url: 'https://careeva-production.up.railway.app',
    github: 'https://github.com/ZbienVC/careeva',
    color: '#0ea5e9',
    colorEnd: '#0284c7',
    tagClass: 'tag-cyan',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'GPT-4', 'Prisma'],
    emoji: '💼',
    highlights: ['AI resume optimization', 'Smart cover letter generation', 'Application tracking', 'Job scoring & matching'],
  },
  {
    id: 'reflect',
    name: 'Reflect Medical',
    tagline: 'Premium Aesthetic Medical Practice Website',
    description: 'A premium medical SaaS-style website and patient experience for Reflect Medical & Cosmetic Center with memberships, treatment catalog, booking flows, Beauty Bank, referrals, and polished conversion-focused UX.',
    status: 'live',
    url: 'https://reflect-medical.web.app',
    github: 'https://github.com/ZbienVC/reflect-medical-premium',
    color: '#b57edc',
    colorEnd: '#8b5cf6',
    tagClass: 'tag-purple',
    tags: ['React', 'Vite', 'TypeScript', 'Firebase', 'Tailwind'],
    emoji: '✨',
    highlights: ['Live production website', 'Premium membership UX', 'Booking + wallet flows', 'Firebase-backed medical platform'],
  },
  {
    id: 'omo',
    name: '$OMO',
    tagline: 'Memecoin Landing Page - The Last White Giraffe',
    description: 'A fully custom memecoin landing site for $OMO - the last white giraffe on earth. Emotional storytelling, Tarangire/Tanzania aesthetic, live DexScreener chart embed, real Omo photography, and Web3 CTAs.',
    status: 'live',
    url: 'https://omogiraffe.fun',
    github: 'https://github.com/ZbienVC/omo-token',
    color: '#D4943A',
    colorEnd: '#C0562A',
    tagClass: '',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Web3'],
    emoji: '🦒',
    highlights: ['Real Omo giraffe photography', 'Live DexScreener chart', 'Tarangire Africa aesthetic', 'Emotional scroll-driven narrative'],
  },
  {
    id: 'gigaton',
    name: '$GIGATON',
    tagline: 'Gigachad on TON — Memecoin Website',
    description: 'A fully custom memecoin landing site for $GIGATON on the TON blockchain. TON-blue design, Gigachad meme gallery, live DexScreener chart, scrolling ticker, and tokenomics.',
    status: 'live',
    url: 'https://gigaton.pro',
    github: 'https://github.com/ZbienVC/gigaton-token',
    color: '#0088CC',
    colorEnd: '#005F8F',
    tagClass: 'tag-blue',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'TON'],
    emoji: '🔷',
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
    emoji: '✈️',
    highlights: ['AI preference parsing', 'Live hotel inventory', 'Real Stripe checkout', 'Zero-key demo mode'],
  },
  {
    id: 'pepelien',
    name: '$PEPELIEN',
    tagline: 'Elon. Pepe. Alien. On Solana.',
    description: 'A fully custom memecoin website for $PEPELIEN on Solana. Space/alien theme, Orbitron font, matrix rain + particle burst effects, Gigachad meme vault, live DexScreener chart, and full Web3 CTAs.',
    status: 'live',
    url: 'https://pepelien.com',
    github: 'https://github.com/ZbienVC/pepelien',
    color: '#39FF14',
    colorEnd: '#4CAF50',
    tagClass: '',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Solana'],
    emoji: '👽',
    highlights: ['Matrix rain + particle burst entry', 'Orbitron space font system', 'Glitch title effect', 'Live Solana chart embed'],
  },
  {
    id: 'staywestpalm',
    name: 'Stay West Palm',
    tagline: 'West Palm Beach Vacation Rental Guide',
    description: 'A beautifully designed local guide for a Palm Beach rental property - curated restaurants, beaches, activities, and insider tips. Fast, mobile-first, and built for guests.',
    status: 'live',
    url: 'https://www.staywestpalm.now',
    github: null,
    color: '#06b6d4',
    colorEnd: '#0284c7',
    tagClass: 'tag-cyan',
    tags: ['TypeScript', 'Vite', 'Tailwind', 'React'],
    emoji: '🌴',
    highlights: ['Curated local recommendations', 'Mobile-first design', 'Fast & lightweight', 'Guest experience focused'],
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
    role: 'Savings Analyst & Sales Engineer',
    company: 'Grapevine',
    period: 'Feb 2024 \u2013 Oct 2025',
    location: 'New York, NY',
    color: '#e0a155',
    highlights: [
      'Built automated Excel reporting systems and Figma dashboards, reducing manual reporting by 80%+',
      'Analyzed tens of thousands of product groups - generated 20-85% cost savings, ranging from tens of thousands to millions annually',
      'Resolved 50+ weekly supply backorders; assisted with client onboarding, vendor integration, and system setup',
    ],
  },
  {
    role: 'Operations & Marketing Coordinator',
    company: 'Reflect Medical & Cosmetic Center',
    period: 'Jul 2023 \u2013 Present',
    location: 'Hawthorne, NJ',
    color: '#c98a5e',
    highlights: [
      'Managed financial workflows in QuickBooks: transaction entry, reconciliation, expense tracking',
      'Oversaw inventory procurement and vendor coordination for consistent medical supply availability',
      'Designed marketing materials, social media assets, and promotional graphics using Canva',
    ],
  },
  {
    role: 'Financial Data Analyst - Surveillance & Threat Detection',
    company: 'Bloomberg LP',
    period: 'Mar 2023 \u2013 Feb 2024',
    location: 'Remote',
    color: '#d4a373',
    highlights: [
      'Analyzed large financial datasets to identify trends and support ML surveillance models',
      'Evaluated derivatives activity - options, swaps, forwards - to validate structured financial data',
      'Collaborated with senior analysts to improve AI-based trade surveillance and threat detection systems',
    ],
  },
  {
    role: 'Investment Banking Intern',
    company: 'Cambridge Wilkinson',
    period: 'Feb 2022 \u2013 Feb 2023',
    location: 'New York, NY',
    color: '#b08d57',
    highlights: [
      'Researched middle-market companies to support debt and equity capital raises ($25M - $1B)',
      'Built detailed target lists of executives and financial metrics for active deal sourcing',
      'Supported investor presentations and discussions with institutional clients',
    ],
  },
  {
    role: 'IPO Markets Intern',
    company: 'Prior2IPO Investments',
    period: 'May 2021 \u2013 Aug 2021',
    location: 'Sparta, NJ',
    color: '#9c8466',
    highlights: [
      'Connected accredited investors with Pre-IPO investment funds and deal opportunities',
      'Conducted outreach to prospective investors and gained exposure to private equity deal flow',
    ],
  },
  {
    role: 'Computer Technician & Builder',
    company: 'Freelance',
    period: 'May 2019 - Aug 2024',
    location: 'Remote',
    color: '#8a7f72',
    highlights: [
      'Built and sold 50+ custom desktop computers through eBay',
      'Diagnosed and repaired hardware/software issues; performed upgrades and performance optimization',
    ],
  },
  {
    role: 'Web3 Project Advisor',
    company: 'Independent / Crypto Projects',
    period: 'Dec 2024 - Present',
    location: 'Remote',
    color: '#c2823a',
    highlights: [
      'Advise early-stage Web3 projects on token design, positioning, marketing strategy, and community growth',
      'Guide go-to-market strategies and token launches reaching + market capitalization',
      'Provide insights on crypto market dynamics, narrative positioning, and digital community engagement',
    ],
  },
];

// ── Components ─────────────────────────────────────────────────────────────────

function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScroll = window.scrollY;
      setScrolled(currentScroll > 40);

      // Hide nav when scrolling down, show when scrolling up
      if (currentScroll > lastScrollRef.current + 10) {
        setHidden(true); // scrolling down
      } else if (currentScroll < lastScrollRef.current - 10) {
        setHidden(false); // scrolling up
      }
      lastScrollRef.current = currentScroll;
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = ['About', 'Projects', 'Experience', 'Skills', 'Demos', 'Life', 'Contact'];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '16px 24px',
      background: scrolled ? 'rgba(11,10,13,0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
      transition: 'all 0.3s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
      opacity: hidden ? 0 : 1,
    }}>
      <a href="#hero" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <span style={{ fontWeight: 800, fontSize: '20px', fontFamily: 'var(--serif)', color: 'var(--ink)' }}>Z<span className="accent-italic" style={{ fontSize: '1.05em' }}>B</span></span>
      </a>

      {/* Desktop Nav */}
      <div className="nav-desktop" style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {navLinks.map(s => (
          <a key={s} href={`#${s.toLowerCase()}`} className="nav-link">{s}</a>
        ))}
        <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
          GitHub ↗
        </a>
      </div>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          background: 'none', border: 'none', color: 'var(--accent-bright)', fontSize: '24px', cursor: 'pointer', padding: '0 8px'
        }}
        className="mobile-menu-btn"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu" style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(11,10,13,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '16px', flexDirection: 'column', gap: '12px'
        }}>
          {navLinks.map(s => (
            <a key={s} href={`#${s.toLowerCase()}`} className="nav-link" onClick={() => setMobileMenuOpen(false)} style={{ padding: '12px 0', fontSize: '14px' }}>{s}</a>
          ))}
          <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="mobile-github-link btn-ghost" style={{ padding: '10px 14px', fontSize: '13px', justifyContent: 'space-between', borderRadius: 12 }}>
            <span>GitHub</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  const titles = ['builder', 'developer', 'founder', 'creator'];
  const [titleIdx, setTitleIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const magRef = useMagnetic(16);
  const meshRef = useParallax(0.18);

  useEffect(() => {
    const current = titles[titleIdx];
    let timeout;
    if (!isDeleting && typed.length < current.length) {
      timeout = setTimeout(() => setTyped(current.slice(0, typed.length + 1)), 90);
    } else if (!isDeleting && typed.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1900);
    } else if (isDeleting && typed.length > 0) {
      timeout = setTimeout(() => setTyped(typed.slice(0, -1)), 45);
    } else if (isDeleting && typed.length === 0) {
      setIsDeleting(false);
      setTitleIdx((titleIdx + 1) % titles.length);
    }
    return () => clearTimeout(timeout);
  }, [typed, isDeleting, titleIdx]);

  return (
    <section id="hero" className="mesh-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Parallax ambient depth (warm) */}
      <div ref={meshRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '14%', left: '12%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,161,85,0.10) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '14%', right: '10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,162,200,0.07) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
        {/* Headshot avatar */}
        <div className="reveal" style={{ marginBottom: 26 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-bright), var(--accent-deep))', padding: 2.5, margin: '0 auto', boxShadow: '0 0 0 1px rgba(224,161,85,0.25), 0 14px 40px rgba(0,0,0,0.5)' }}>
            <img src="/headshot.jpg" alt="Zach Bienstock" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
          </div>
        </div>

        {/* Badge */}
        <div className="reveal d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 100, padding: '6px 15px', marginBottom: 30, fontSize: 12.5, color: 'var(--accent-bright)', fontWeight: 600, fontFamily: 'var(--mono)', letterSpacing: 0.3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-bright)', display: 'inline-block', boxShadow: '0 0 8px var(--accent-glow)', animation: 'pulse 2.4s infinite' }} />
          Available for opportunities
        </div>

        {/* Name — editorial serif with mask-reveal */}
        <h1 style={{ fontSize: 'clamp(54px, 9vw, 104px)', lineHeight: 0.98, marginBottom: 18, letterSpacing: '-2px', fontFamily: 'var(--sans)', fontWeight: 800 }}>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span style={{ display: 'inline-block', color: 'var(--ink)', animation: 'maskUp 0.8s cubic-bezier(0.2,0.7,0.2,1) both' }}>Zach</span>
          </span>
          <span style={{ display: 'block', overflow: 'hidden' }}>
            <span className="accent-italic" style={{ display: 'inline-block', fontSize: '1.04em', animation: 'maskUp 0.8s cubic-bezier(0.2,0.7,0.2,1) 0.12s both' }}>Bienstock</span>
          </span>
        </h1>

        {/* Rotating role line */}
        <div style={{ fontSize: 'clamp(17px, 2.4vw, 22px)', fontWeight: 500, marginBottom: 26, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', animation: 'fadeUp 0.7s ease 0.5s both' }}>
          <span style={{ color: 'var(--ink-4)' }}>{'// '}</span>
          <span style={{ marginLeft: 6, color: 'var(--ink-2)' }}>{typed}</span>
          <span style={{ width: 9, height: 20, background: 'var(--accent)', marginLeft: 4, display: 'inline-block', animation: 'pulse 1s step-end infinite' }} />
        </div>

        {/* Bio */}
        <p className="reveal d2" style={{ fontSize: 18, color: 'var(--ink-3)', lineHeight: 1.75, maxWidth: 600, margin: '0 auto 38px', fontWeight: 400 }}>
          I don't just want to know how things work — I want to make them <span className="serif-italic" style={{ color: 'var(--ink)', fontSize: '1.12em' }}>work better</span>. Finance background from <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Bloomberg</span> &amp; <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Investment Banking</span>, now building at the intersection of <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>data</span>, <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>product</span>, and <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>AI</span>.
        </p>

        {/* CTAs */}
        <div className="reveal d3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a ref={magRef} href="#projects" className="btn-primary magnetic" style={{ fontSize: 15 }}>
            View My Work ↓
          </a>
          <a href="/Zachary_Bienstock_Resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 15 }}>
            Resume ↗
          </a>
        </div>

        {/* Stats */}
        <div className="reveal d4" style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
          {[
            { num: '10', label: 'Live in Production' },
            { num: '3+', label: 'Currently Building' },
            { num: '∞', label: 'Problems Left to Solve' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div className="serif" style={{ fontSize: 44, lineHeight: 1, color: 'var(--ink)' }}>{s.num}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 8, fontFamily: 'var(--mono)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: 32, right: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
        <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
        <span style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, writingMode: 'vertical-rl', fontFamily: 'var(--mono)' }}>Scroll</span>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>About Me</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1px', maxWidth: 700, margin: '0 auto' }}>
          I want to understand how things<br />
          <span className="accent-italic" style={{ fontSize: '1.1em' }}>actually work.</span>
        </h2>
      </div>

      {/* Quote callout */}
      <div className="glass reveal" style={{ borderRadius: 20, padding: '28px 36px', maxWidth: 780, margin: '0 auto 64px', borderLeft: '3px solid var(--accent)', position: 'relative' }}>
        <div style={{ fontSize: 64, color: 'var(--accent)', opacity: 0.18, position: 'absolute', top: 8, left: 18, fontFamily: 'var(--serif)', lineHeight: 1 }}>“</div>
        <p style={{ color: 'var(--ink-2)', fontSize: 19, lineHeight: 1.7, fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, paddingLeft: 8 }}>
          I naturally operate at the intersection of <span className="accent-text" style={{ fontStyle: 'normal', fontWeight: 700, fontFamily: 'var(--sans)' }}>data</span>, <span className="accent-text" style={{ fontStyle: 'normal', fontWeight: 700, fontFamily: 'var(--sans)' }}>creativity</span>, and <span className="accent-text" style={{ fontStyle: 'normal', fontWeight: 700, fontFamily: 'var(--sans)' }}>strategy</span>. I'm at my best when I can take something complex or messy and turn it into something clearer, more usable, and more thoughtful.
        </p>
      </div>

      {/* Two column bio + traits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>
        <div>
          {/* Headshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-bright), var(--accent-deep))', padding: 3 }}>
                <img src="/headshot.jpg" alt="Zach Bienstock" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
              </div>
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)' }}>Zach Bienstock</div>
              <div style={{ color: 'var(--accent-bright)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }}>Builder · Analyst · Developer</div>
              <div style={{ color: 'var(--ink-4)', fontSize: 12, marginTop: 2 }}>Hawthorne, NJ</div>
            </div>
          </div>
          <p style={{ color: 'var(--ink-3)', lineHeight: 1.85, fontSize: 15, marginBottom: 20 }}>
            Finance graduate from <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Rutgers</span> who spent time analyzing derivatives at <span style={{ color: '#4f9deb', fontWeight: 600 }}>Bloomberg LP</span> and supporting $25M-$1B capital raises at <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Cambridge Wilkinson</span> before turning full attention to building software.
          </p>
          <p style={{ color: 'var(--ink-3)', lineHeight: 1.85, fontSize: 15, marginBottom: 20 }}>
            That curiosity has been with me since long before formal roles - buying and selling online, building and fixing computers, learning how value is created and exchanged. I tend to think in systems rather than tasks. I ask where information comes from, what it represents in the real world, and how it could be better.
          </p>
          <p style={{ color: 'var(--ink-3)', lineHeight: 1.85, fontSize: 15, marginBottom: 32 }}>
            Outside of work: deeply into <span style={{ color: 'var(--ink)', fontWeight: 600 }}>crypto mechanics</span> and incentive design, <span style={{ color: 'var(--ink)', fontWeight: 600 }}>cognitive science</span> and how attention works, and <span style={{ color: 'var(--ink)', fontWeight: 600 }}>snowboarding</span> - specifically the technical side of board design and performance optimization. That same mindset shows up in my work.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14 }}>GitHub ↗</a>
            <a href="https://www.linkedin.com/in/zach-bienstock" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 14 }}>LinkedIn ↗</a>
          </div>
        </div>

        {/* Traits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Systems Thinker - pulsing network nodes */}
          <div className="glass glass-hover" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: 'rgba(16,217,160,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'glowPulse 3s ease-in-out infinite' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill="#10d9a0" style={{ animation: 'iconPulse 2s ease-in-out infinite' }} />
                <circle cx="4" cy="5" r="2" fill="#10d9a0" opacity="0.6" style={{ animation: 'iconPulse 2s ease-in-out infinite 0.3s' }} />
                <circle cx="20" cy="5" r="2" fill="#10d9a0" opacity="0.6" style={{ animation: 'iconPulse 2s ease-in-out infinite 0.6s' }} />
                <circle cx="4" cy="19" r="2" fill="#10d9a0" opacity="0.6" style={{ animation: 'iconPulse 2s ease-in-out infinite 0.9s' }} />
                <circle cx="20" cy="19" r="2" fill="#10d9a0" opacity="0.6" style={{ animation: 'iconPulse 2s ease-in-out infinite 1.2s' }} />
                <line x1="9" y1="10.5" x2="6" y2="6.5" stroke="#10d9a0" strokeWidth="1.2" opacity="0.4"/>
                <line x1="15" y1="10.5" x2="18" y2="6.5" stroke="#10d9a0" strokeWidth="1.2" opacity="0.4"/>
                <line x1="9" y1="13.5" x2="6" y2="17.5" stroke="#10d9a0" strokeWidth="1.2" opacity="0.4"/>
                <line x1="15" y1="13.5" x2="18" y2="17.5" stroke="#10d9a0" strokeWidth="1.2" opacity="0.4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>Systems Thinker</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>I ask where data comes from, what it represents, and how confident we should be in it. Numbers should explain reality, not just look correct.</div>
            </div>
          </div>

          {/* Builder by Nature - blinking code cursor */}
          <div className="glass glass-hover" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: 'rgba(79,157,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polyline points="8,6 3,12 8,18" stroke="#4f9deb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,6 21,12 16,18" stroke="#4f9deb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="4" x2="10.5" y2="20" stroke="#4f9deb" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <rect x="13" y="10" width="2" height="5" rx="1" fill="#4f9deb" style={{ animation: 'iconPulse 1s step-end infinite' }} />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>Builder by Nature</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>Long before formal roles - repairing computers, selling online, advising crypto launches. I learn by doing and care about ownership.</div>
            </div>
          </div>

          {/* Impact Over Process - flashing bolt */}
          <div className="glass glass-hover" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: 'iconBolt 3s ease-in-out infinite' }}>
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#f59e0b" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>Impact Over Process</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>I don't enjoy analysis that lives in isolation. Every insight should turn into a decision, a better experience, or a smarter system.</div>
            </div>
          </div>

          {/* Precision & Iteration - spinning target ring */}
          <div className="glass glass-hover" style={{ borderRadius: 16, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.4" style={{ transformOrigin: 'center', animation: 'iconSpin 8s linear infinite' }}/>
                <circle cx="12" cy="12" r="6" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7"/>
                <circle cx="12" cy="12" r="2.5" fill="#8b5cf6"/>
                <line x1="12" y1="2" x2="12" y2="5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <line x1="12" y1="19" x2="12" y2="22" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <line x1="2" y1="12" x2="5" y2="12" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                <line x1="19" y1="12" x2="22" y2="12" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>Precision & Iteration</div>
              <div style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.6 }}>Drawn to the technical details. Snowboard geometry, ML model validation, product design - I care about why things work, not just that they do.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }) {
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const projectDemos = {
    splash: <CryptoTickerDemo />,
    careeva: <JobMatcherDemo />,
    plato: <MealPlannerDemo />,
  };

  const hasDemo = projectDemos[project.id];

  const handleFlipClick = (e) => {
    e.stopPropagation();
    setFlipped((v) => !v);
  };

  const statusCfg = project.status === 'live'
    ? { bg: 'rgba(16,217,160,0.12)', color: '#10d9a0', border: 'rgba(16,217,160,0.25)', label: 'Live' }
    : project.status === 'soon'
    ? { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.25)', label: 'Coming Soon' }
    : { bg: 'rgba(79,157,235,0.12)', color: '#4f9deb', border: 'rgba(79,157,235,0.25)', label: 'Building' };

  return (
    <div
      className="glass project-card compact-project-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 22,
        overflow: 'hidden',
        transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered && !flipped ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered || flipped ? `0 20px 48px rgba(0,0,0,0.34), 0 0 0 1px ${project.color}22` : '0 4px 20px rgba(0,0,0,0.2)',
        borderColor: hovered || flipped ? `${project.color}22` : 'rgba(255,255,255,0.06)',
        perspective: '1000px',
      }}
    >
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          style={{
            opacity: flipped ? 0 : 1,
            transform: flipped ? 'translateX(-16px)' : 'translateX(0)',
            transition: 'all 0.32s ease-in-out',
            pointerEvents: flipped ? 'none' : 'auto',
          }}
        >
          <div style={{ height: 3, background: `linear-gradient(90deg, ${project.color}, ${project.colorEnd})` }} />

          <div className="compact-project-inner" style={{ padding: '22px 22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: `0 8px 20px ${project.color}33`, flexShrink: 0 }}>
                  {project.emoji}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{ fontWeight: 900, fontSize: 22, color: 'var(--ink)', lineHeight: 1.05, margin: 0 }}>{project.name}</h3>
                    <div className="status-badge" style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />
                      {statusCfg.label}
                    </div>
                  </div>
                  <p style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>{project.tagline}</p>
                </div>
              </div>
            </div>

            <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.65, marginBottom: 14 }}>
              {project.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {project.highlights.slice(0, 4).map((h) => (
                <div key={h} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45 }}>
                  <span style={{ color: project.color, fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {project.tags.slice(0, 4).map(t => (
                <span key={t} className={`tag ${project.tagClass}`} style={{ background: `${project.color}12`, color: project.color, borderColor: `${project.color}25` }}>{t}</span>
              ))}
              {project.tags.length > 4 && (
                <span className="tag" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)', borderColor: 'rgba(255,255,255,0.1)' }}>+{project.tags.length - 4}</span>
              )}
            </div>

            <div className="compact-project-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {project.url && (
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn-primary compact-btn" style={{ fontSize: 13, padding: '10px 16px', background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, boxShadow: `0 4px 15px ${project.color}30` }} onClick={(e) => e.stopPropagation()}>
                  Visit ↗
                </a>
              )}
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn-ghost compact-btn" style={{ fontSize: 13, padding: '10px 16px' }} onClick={(e) => e.stopPropagation()}>
                GitHub ↗
              </a>
              {hasDemo && (
                <button
                  onClick={handleFlipClick}
                  className="btn-ghost compact-btn"
                  style={{ fontSize: 13, padding: '10px 16px', borderColor: `${project.color}30`, color: project.color }}
                >
                  Try →
                </button>
              )}
            </div>
          </div>
        </div>

        {hasDemo && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: flipped ? 1 : 0,
              transform: flipped ? 'translateX(0)' : 'translateX(20px)',
              transition: 'all 0.32s ease-in-out',
              pointerEvents: flipped ? 'auto' : 'none',
              padding: 20,
              background: 'rgba(8,12,24,0.96)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, boxShadow: `0 0 12px ${project.color}80` }} />
                <h4 style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 700, margin: 0 }}>Try {project.name}</h4>
              </div>
              <button
                onClick={handleFlipClick}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: `1px solid ${project.color}40`,
                  borderRadius: 8,
                  color: project.color,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            </div>
            {projectDemos[project.id]}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCarouselCard({ project, position }) {
  const [hovered, setHovered] = useState(false);
  const isCenter = position === 'center';
  const isLeft = position === 'left';
  const isRight = position === 'right';

  const statusCfg = project.status === 'live'
    ? { bg: 'rgba(16,217,160,0.12)', color: '#10d9a0', border: 'rgba(16,217,160,0.25)', label: 'Live' }
    : project.status === 'soon'
    ? { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: 'rgba(139,92,246,0.25)', label: 'Soon' }
    : { bg: 'rgba(79,157,235,0.12)', color: '#4f9deb', border: 'rgba(79,157,235,0.25)', label: 'Building' };

  const sideExtra = (isLeft || isRight) ? { transform: 'scale(0.92)', opacity: 0.65, filter: 'blur(1px)', pointerEvents: 'none' } : {};
  const hoverExtra = isCenter && hovered ? { transform: 'translateY(-4px)', border: `1px solid ${project.color}55`, boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${project.color}25` } : {};

  return (
    <div
      onMouseEnter={() => isCenter && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 340,
        flexShrink: 0,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isCenter ? project.color + '30' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: isCenter ? `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px ${project.color}20` : 'none',
        ...sideExtra,
        ...hoverExtra,
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${project.color}, ${project.colorEnd})` }} />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{project.emoji}</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', flex: 1 }}>{project.name}</span>
          <div style={{ padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />
            {statusCfg.label}
          </div>
        </div>
        <p style={{ color: 'var(--ink-2)', fontSize: 13, fontWeight: 500, lineHeight: 1.45, marginBottom: 14 }}>{project.tagline}</p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />
        <p style={{ color: 'var(--ink-3)', fontSize: 13, lineHeight: 1.65, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 18 }}>
          {project.tags.slice(0, 4).map(t => (
            <span key={t} style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${project.color}12`, color: project.color, border: `1px solid ${project.color}25` }}>{t}</span>
          ))}
          {project.tags.length > 4 && (
            <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)' }}>+{project.tags.length - 4}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer"
              style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${project.color}, ${project.colorEnd})`, color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >View Live ↗</a>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer"
              style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: 'var(--ink-2)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none' }}
            >GitHub ↗</a>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectsSection() {
  const CATS = {
    all: PROJECTS,
    ai: PROJECTS.filter(p => ['dipper','careeva','plato','reflect','wayfound'].includes(p.id)),
    crypto: ['splash','pepelien','omo','gigaton'].map(id => PROJECTS.find(p => p.id === id)).filter(Boolean),
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
    <section id="projects" style={{ padding: '88px 24px 72px', background: 'var(--bg-2)' }}>
      <style>{`
        @keyframes pf { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .pf { animation: pf 0.28s ease forwards; }
        .tab-btn:hover { opacity: 0.85; }
      `}</style>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>

        <div className="reveal" style={{ textAlign:'center', marginBottom: 48 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>What I've Built</p>
          <h2 style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:900, letterSpacing:'-1px', marginBottom:8 }}>
            Projects <span className="accent-italic" style={{ fontSize: '1.1em' }}>in the wild</span>
          </h2>
          <p style={{ color:'var(--ink-4)', fontSize:14, fontFamily:"'JetBrains Mono',monospace" }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} — {activeTabObj?.label}
          </p>
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
          {TABS.map(tab => {
            const on = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => switchTab(tab.id)} className="tab-btn"
                style={{ padding:'10px 22px', borderRadius:100, fontSize:13, fontWeight:700, cursor:'pointer',
                  border: `1px solid ${on ? 'var(--accent-line)' : 'rgba(255,255,255,0.08)'}`,
                  background: on ? 'var(--accent-soft)' : 'rgba(255,255,255,0.04)',
                  color: on ? 'var(--accent-bright)' : 'var(--ink-3)',
                  display:'flex', alignItems:'center', gap:8,
                  boxShadow: on ? '0 0 20px var(--accent-soft)' : 'none',
                  transition:'all 0.2s' }}>
                <span>{tab.label}</span>
                <span style={{ padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:700,
                  background: on ? 'var(--accent-soft)' : 'rgba(255,255,255,0.06)',
                  color: on ? 'var(--accent-bright)' : 'var(--ink-4)' }}>{tab.count}</span>
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
                    animation:`pf 0.3s ease ${i*60}ms both`,
                    border:'1px solid rgba(255,255,255,0.07)',
                    boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
                    <div style={{ height:3, background:`linear-gradient(90deg,${p.color},${p.colorEnd})` }} />
                    <div style={{ padding:'26px 26px 24px', display:'flex', flexDirection:'column', gap:16 }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                        <div style={{ width:54, height:54, borderRadius:16, background:`linear-gradient(135deg,${p.color},${p.colorEnd})`,
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0,
                          boxShadow:`0 8px 20px ${p.color}40` }}>{p.emoji}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:5 }}>
                            <h3 style={{ fontWeight:900, fontSize:22, color:'var(--ink)', margin:0, lineHeight:1.1 }}>{p.name}</h3>
                            <div style={{ padding:'3px 10px', borderRadius:100, fontSize:10, fontWeight:700,
                              textTransform:'uppercase', letterSpacing:1,
                              background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`,
                              display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                              <span style={{ width:5, height:5, borderRadius:'50%', background:sc.color, display:'inline-block' }} />
                              {sc.label}
                            </div>
                            {p.featured && (
                              <div style={{ padding:'3px 10px', borderRadius:100, fontSize:10, fontWeight:800,
                                textTransform:'uppercase', letterSpacing:1,
                                background:`${p.color}1a`, color:p.color, border:`1px solid ${p.color}40`,
                                display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                                ⭐ Best Work
                              </div>
                            )}
                          </div>
                          <p style={{ color:'var(--ink-2)', fontSize:13, fontWeight:600, margin:0 }}>{p.tagline}</p>
                        </div>
                      </div>
                      <p style={{ color:'var(--ink-3)', fontSize:14, lineHeight:1.7, margin:0 }}>{p.description}</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
                        {p.highlights.slice(0,4).map(h => (
                          <div key={h} style={{ display:'flex', gap:7, fontSize:12, color:'var(--ink-2)', lineHeight:1.45 }}>
                            <span style={{ color:p.color, fontWeight:700, flexShrink:0 }}>→</span><span>{h}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {p.tags.slice(0,5).map(t => (
                          <span key={t} style={{ padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:600,
                            background:`${p.color}12`, color:p.color, border:`1px solid ${p.color}25` }}>{t}</span>
                        ))}
                        {p.tags.length > 5 && (
                          <span style={{ padding:'4px 10px', borderRadius:7, fontSize:11, fontWeight:600,
                            background:'rgba(255,255,255,0.05)', color:'var(--ink-2)', border:'1px solid rgba(255,255,255,0.1)' }}>
                            +{p.tags.length-5}
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700,
                              background:`linear-gradient(135deg,${p.color},${p.colorEnd})`,
                              color:'#fff', textDecoration:'none',
                              boxShadow:`0 4px 14px ${p.color}30` }}>
                            Visit Live ↗
                          </a>
                        )}
                        {p.telegram && (
                          <a href={p.telegram} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:700,
                              background:'rgba(79,157,235,0.12)', color:'#4f9deb',
                              border:'1px solid rgba(79,157,235,0.3)', textDecoration:'none',
                              display:'inline-flex', alignItems:'center', gap:6 }}>
                            ✈️ Telegram Bot
                          </a>
                        )}
                        {p.twitter && (
                          <a href={p.twitter} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:700,
                              background:'rgba(255,255,255,0.05)', color:'var(--ink-2)',
                              border:'1px solid rgba(255,255,255,0.12)', textDecoration:'none',
                              display:'inline-flex', alignItems:'center', gap:6 }}>
                            𝕏 Twitter
                          </a>
                        )}
                        {p.github && (
                          <a href={p.github} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:700,
                              background:'rgba(255,255,255,0.05)', color:'var(--ink-2)',
                              border:'1px solid rgba(255,255,255,0.1)', textDecoration:'none' }}>
                            GitHub ↗
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
                <span style={{ fontSize:11, color:'var(--ink-4)', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:2, whiteSpace:'nowrap' }}>More Projects</span>
                <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.05)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap:14 }}>
                {compact.map((p, i) => {
                  const sc = statusCfg(p.status);
                  return (
                    <div key={p.id} className="glass" style={{ borderRadius:18, overflow:'hidden',
                      transition:'all 0.25s', animation:`pf 0.3s ease ${(i+2)*60}ms both` }}>
                      <div style={{ height:2, background:`linear-gradient(90deg,${p.color},${p.colorEnd})` }} />
                      <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:11 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                            background:`linear-gradient(135deg,${p.color},${p.colorEnd})`,
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{p.emoji}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                              <span style={{ fontWeight:800, fontSize:15, color:'var(--ink)' }}>{p.name}</span>
                              <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                                color:sc.color, letterSpacing:0.5 }}>● {sc.label}</span>
                            </div>
                            <p style={{ color:'var(--ink-3)', fontSize:12, margin:0, lineHeight:1.4, marginTop:2 }}>{p.tagline}</p>
                          </div>
                        </div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {p.tags.slice(0,3).map(t => (
                            <span key={t} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600,
                              background:`${p.color}10`, color:p.color, border:`1px solid ${p.color}20` }}>{t}</span>
                          ))}
                          {p.tags.length > 3 && (
                            <span style={{ padding:'3px 8px', borderRadius:6, fontSize:10,
                              color:'var(--ink-4)', background:'rgba(255,255,255,0.04)',
                              border:'1px solid rgba(255,255,255,0.08)' }}>+{p.tags.length-3}</span>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:8 }}>
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              style={{ padding:'7px 14px', borderRadius:8, fontSize:11, fontWeight:700,
                                background:`linear-gradient(135deg,${p.color},${p.colorEnd})`,
                                color:'#fff', textDecoration:'none' }}>Visit ↗</a>
                          )}
                          {p.github && (
                            <a href={p.github} target="_blank" rel="noopener noreferrer"
                              style={{ padding:'7px 14px', borderRadius:8, fontSize:11, fontWeight:600,
                                background:'rgba(255,255,255,0.05)', color:'var(--ink-3)',
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
            padding:'12px 24px', borderRadius:100, fontSize:13, color:'var(--ink-3)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#8b5cf6',
              display:'inline-block', animation:'pulse 2s infinite' }} />
            More projects shipping soon
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  const [expanded, setExpanded] = useState(null);

  const toggle = (i) => setExpanded(expanded === i ? null : i);

  return (
    <section id="experience" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Background</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
          Where I've <span className="accent-italic" style={{ fontSize: '1.1em' }}>been</span>
        </h2>
      </div>

      <style>{`
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
      `}</style>

      <div className="exp-grid" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXPERIENCE.filter((_, i) => i % 2 === 0).map((exp, colIdx) => {
            const realIdx = colIdx * 2;
            const isOpen = expanded === realIdx;
            return (
              <div key={realIdx} onClick={() => toggle(realIdx)}
                className={`exp-card ${isOpen ? 'expanded' : ''}`}
                style={{ borderLeftColor: exp.color, boxShadow: isOpen ? `0 8px 32px ${exp.color}20, -2px 0 0 ${exp.color}` : `0 2px 12px rgba(0,0,0,0.2)` }}>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: `linear-gradient(to left, ${exp.color}06, transparent)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 4 }}>{exp.role}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: exp.color }}>{exp.company}</span>
                      <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>·</span>
                      <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>{exp.location}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{exp.period}</span>
                    <span style={{ fontSize: 12, color: isOpen ? exp.color : 'var(--ink-4)', transition: 'all 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>›</span>
                  </div>
                </div>
                <div className={`exp-highlights ${isOpen ? 'open' : ''}`}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exp.highlights.map((h, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                        <span style={{ color: exp.color, flexShrink: 0, fontWeight: 700 }}>›</span> {h}
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
                className={`exp-card ${isOpen ? 'expanded' : ''}`}
                style={{ borderLeftColor: exp.color, boxShadow: isOpen ? `0 8px 32px ${exp.color}20, -2px 0 0 ${exp.color}` : `0 2px 12px rgba(0,0,0,0.2)` }}>
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 80, background: `linear-gradient(to left, ${exp.color}06, transparent)`, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 4 }}>{exp.role}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: exp.color }}>{exp.company}</span>
                      <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>·</span>
                      <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>{exp.location}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{exp.period}</span>
                    <span style={{ fontSize: 12, color: isOpen ? exp.color : 'var(--ink-4)', transition: 'all 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>›</span>
                  </div>
                </div>
                <div className={`exp-highlights ${isOpen ? 'open' : ''}`}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {exp.highlights.map((h, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                        <span style={{ color: exp.color, flexShrink: 0, fontWeight: 700 }}>›</span> {h}
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
        <div className="glass" style={{ borderRadius: 18, padding: '18px 24px', borderLeft: '3px solid var(--accent)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28 }}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginBottom: 2 }}>B.S. Finance — Business Analytics</div>
            <div style={{ color: 'var(--accent-bright)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Rutgers University, New Brunswick</div>
            <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent-bright)', borderColor: 'var(--accent-line)', fontSize: 11 }}>SQL Cert — UC Davis</span>
          </div>
          <div style={{ color: 'var(--ink-4)', fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>Dec 2022</div>
        </div>
      </div>

      {/* Resume CTA */}
      <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="https://bold.pro/my/zachary-bienstock/354r" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 14 }}>
          View Resume Online ↗
        </a>
        <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: 14 }}>
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
  { src: '/life/photo8.jpg',  label: 'Friends dinner' },
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
    <section id="life" style={{ padding: '100px 24px', background: 'var(--bg-2)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Beyond the Work</p>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
            A slice of <span className="accent-italic" style={{ fontSize: '1.1em' }}>life</span>
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
                    ? '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--accent-line)'
                    : '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                <img src={photo.src} alt={photo.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
                {isActive && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
                      <span style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>{photo.label}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 40 }}>
          <button onClick={prev} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.background='var(--accent-soft)'}
            onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.06)'}
          >←</button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 8 }}>
            {LIFE_PHOTOS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 24 : 8, height: 8, borderRadius: 4, background: i === active ? 'var(--accent)' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }} />
            ))}
          </div>

          <button onClick={next} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--ink)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => e.target.style.background='var(--accent-soft)'}
            onMouseLeave={e => e.target.style.background='rgba(255,255,255,0.06)'}
          >→</button>
        </div>

        {/* Swipe hint */}
        <p style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 12, marginTop: 16, fontFamily: "'JetBrains Mono', monospace" }}>
          drag or swipe to explore
        </p>
      </div>
    </section>
  );
}

function SkillsSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="skills" style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }} ref={ref}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Tech Stack</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px' }}>
          Tools I <span className="accent-italic" style={{ fontSize: '1.1em' }}>build with</span>
        </h2>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {SKILLS.map((s, i) => (
          <div
            key={s.label}
            className={`glass glass-hover skill-card ${visible ? 'skill-animate' : ''}`}
            style={{
              padding: '14px 22px',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'default',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
              transition: `all 0.5s ease ${i * 50}ms`,
              background: `linear-gradient(135deg, var(--accent-soft), rgba(138,162,200,0.05))`,
            }}
          >
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink-2)' }}>{s.label}</span>
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
    <section id="contact" style={{ padding: '100px 24px', background: 'var(--bg-2)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <p className="section-label" style={{ marginBottom: 16 }}>Get In Touch</p>
        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 20 }}>
          Let's build something<br />
          <span className="accent-italic" style={{ fontSize: '1.1em' }}>together.</span>
        </h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 16, lineHeight: 1.7, marginBottom: 48 }}>
          Open to interesting opportunities, collabs, and conversations. Whether you have a project idea or just want to connect - reach out.
        </p>

        {/* Social links */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <a href="https://github.com/ZbienVC" target="_blank" rel="noopener noreferrer" className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, fontSize: 15 }}>
            <span style={{ fontSize: 20 }}>🐙</span> GitHub
          </a>
          <a href="https://www.linkedin.com/in/zach-bienstock" target="_blank" rel="noopener noreferrer" className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, fontSize: 15 }}>
            <span style={{ fontSize: 20 }}>💼</span> LinkedIn
          </a>
          <a href="mailto:Zbienstock@gmail.com" className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, fontSize: 15 }}>
            <span style={{ fontSize: 20 }}>✉️</span> Email
          </a>
          <button onClick={() => copy('Zbienstock@gmail.com')} className="glass glass-hover" style={{ padding: '16px 24px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.06)', color: copied ? '#10d9a0' : 'var(--ink-2)', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'rgba(15,22,41,0.7)', backdropFilter: 'blur(20px)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: 16 }}>{copied ? '✅' : '📋'}</span> {copied ? 'Copied!' : 'Copy Email'}
          </button>
        </div>

        {/* Footer note */}
        <p style={{ color: 'var(--ink-4)', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
          Built by Zach Bienstock · 2026
        </p>
      </div>
    </section>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        background: 'linear-gradient(90deg, var(--accent-deep), var(--accent-bright))',
        width: `${progress}%`,
        zIndex: 10000,
        transition: 'width 0.1s ease',
        boxShadow: '0 0 10px var(--accent-glow)',
      }}
    />
  );
}

export default function App() {
  useScrollReveal();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <ScrollProgressBar />
      <ChatWidget />
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





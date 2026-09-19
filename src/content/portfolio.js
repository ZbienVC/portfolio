// ─────────────────────────────────────────────────────────────────────────────
// Portfolio content — single source of truth.
// Extracted verbatim from the v1 editorial site (backup branch: backup/editorial-site-v1).
// The cinematic alpine journey and the reduced-motion fallback both read from here.
// ─────────────────────────────────────────────────────────────────────────────

export const PROFILE = {
  name: 'Zach Bienstock',
  first: 'Zach',
  last: 'Bienstock',
  roles: ['builder', 'developer', 'founder', 'creator'],
  title: 'Builder · Analyst · Developer',
  location: 'Hawthorne, NJ',
  availability: 'Available for opportunities',
  headshot: '/headshot.jpg',
  tagline:
    "I don't just want to know how things work. I want to make them work better.",
  intro:
    'Finance background from Bloomberg & Investment Banking, now building at the intersection of data, product, and AI.',
  // the résumé's own positioning line (2026-09), used by the classic site's hero
  headline: 'I build the systems the work runs on.',
  summary:
    'Finance and operations professional who builds the systems the work runs on, using AI as the development stack. Five years across financial services, telecom, and startups.',
  resumePdf: '/resume.pdf',
  resumePdfNamed: '/Zachary_Bienstock_Resume.pdf',
  email: 'zbienstock@gmail.com',
  socials: {
    github: 'https://github.com/ZbienVC',
    linkedin: 'https://www.linkedin.com/in/zach-bienstock',
  },
};

export const ABOUT = {
  quote:
    "I naturally operate at the intersection of data, creativity, and strategy. I'm at my best when I can take something complex or messy and turn it into something clearer, more usable, and more thoughtful.",
  quoteAccents: ['data', 'creativity', 'strategy'],
  paragraphs: [
    'Finance graduate from Rutgers who spent time analyzing derivatives at Bloomberg LP and supporting $25M–$1B capital raises at Cambridge Wilkinson before turning full attention to building software.',
    'That curiosity has been with me since long before formal roles: buying and selling online, building and fixing computers, learning how value is created and exchanged. I tend to think in systems rather than tasks. I ask where information comes from, what it represents in the real world, and how it could be better.',
    'Outside of work: deeply into crypto mechanics and incentive design, cognitive science and how attention works, and snowboarding, specifically the technical side of board design and performance optimization. That same mindset shows up in my work.',
  ],
  traits: [
    {
      title: 'Systems Thinker',
      body: 'I ask where data comes from, what it represents, and how confident we should be in it. Numbers should explain reality, not just look correct.',
    },
    {
      title: 'Builder by Nature',
      body: 'Long before formal roles: repairing computers, selling online, advising crypto launches. I learn by doing and care about ownership.',
    },
    {
      title: 'Impact Over Process',
      body: "I don't enjoy analysis that lives in isolation. Every insight should turn into a decision, a better experience, or a smarter system.",
    },
    {
      title: 'Precision & Iteration',
      body: 'Drawn to the technical details. Snowboard geometry, ML model validation, product design. I care about why things work, not just that they do.',
    },
  ],
  education: {
    degree: 'B.S. Finance, Business Analytics',
    school: 'Rutgers University, New Brunswick',
    cert: 'SQL Cert, UC Davis',
    date: 'Dec 2022',
  },
};

// Wording and dates follow the résumés (public/*.pdf, updated 2026-09-18).
// `start`/`end` are ISO months for sorting and the timeline; `period` is display.
// `kind`: 'role' (employment and internships) | 'side' (freelance alongside).
export const EXPERIENCE = [
  {
    role: 'Financial Operations Analyst',
    company: 'Interactive Telecom Solutions & Platform Technologies',
    period: 'Jun 2026 – Present',
    start: '2026-06',
    end: null,
    type: 'Full time',
    kind: 'role',
    location: 'New Jersey',
    color: '#e8b06a',
    highlights: [
      'Own the books for two affiliated telecom companies: accounts payable and receivable, QuickBooks entry, reconciliation, and the monthly close',
      'Reconcile carrier and agent commissions across a multi-carrier book, checking what carriers actually paid against contracted rates and working out what each agent is owed',
      'Built the automation that now runs accounts payable. Invoices and carrier statements get pulled in, renamed, filed, and converted into IIF files that import straight into QuickBooks, taking roughly 30 hours of filing and data entry out of every month',
      "Wrote a tool that compares each month's carrier statements against the prior month so missing, changed, and underpaid lines get caught",
      'Built the internal platform the rest of it runs on, plus FCC Form 499-Q reporting pulled from billing data and revenue and margin tracking by carrier. Built solo, with AI coding tools as the development stack',
    ],
  },
  {
    role: 'Savings Analyst & Sales Engineer',
    company: 'Grapevine',
    period: 'Feb 2024 – Oct 2025',
    start: '2024-02',
    end: '2025-10',
    type: 'Full time',
    kind: 'role',
    location: 'New York, NY',
    color: '#e0a155',
    highlights: [
      'Built the savings models and customer reports the sales team ran on, combining advanced Excel work with Figma dashboards and consistently showing 40%+ average cost savings',
      'Automated that reporting with macros, scripts, AI-assisted tooling, and email triggers, cutting manual analysis and reporting by 80%+',
      'Worked through tens of thousands of product groups to find substitutions, generating 20 to 85% savings with annual client impact from thousands to millions',
      'Ran fidelity checks, cleared 50+ backorders a week, and helped onboard new clients and vendors',
    ],
  },
  {
    role: 'Financial Data Analyst, Surveillance & Threat Detection',
    company: 'Bloomberg LP',
    period: 'Apr 2023 – Feb 2024',
    start: '2023-04',
    end: '2024-02',
    type: 'Full time',
    kind: 'role',
    location: 'Remote',
    color: '#d4a373',
    highlights: [
      'Pulled apart large financial datasets to surface metrics and outlier trends feeding machine learning surveillance models',
      'Evaluated derivatives and trade activity, including options, swaps, and forwards, to build out the validated database behind AI trade assessment',
      'Tagged and verified surveillance-relevant data inside client text alongside senior analysts, which measurably improved model accuracy and target detection',
    ],
  },
  {
    role: 'Operations & Marketing Coordinator',
    company: 'Reflect Medical & Cosmetic Center',
    period: 'Jul 2023 – Jun 2026',
    start: '2023-07',
    end: '2026-06',
    type: 'Part time',
    kind: 'role',
    location: 'Hawthorne, NJ',
    color: '#c98a5e',
    highlights: [
      'Ran the financial side in QuickBooks: transaction entry, reconciliation, expense tracking, and purchase orders',
      "Managed supply inventory and vendor relationships, and produced the practice's marketing materials and social content using AI tools and Canva",
    ],
  },
  {
    role: 'Investment Banking Intern',
    company: 'Cambridge Wilkinson',
    period: 'Feb 2022 – Feb 2023',
    start: '2022-02',
    end: '2023-02',
    type: 'Internship',
    kind: 'role',
    location: 'New York, NY',
    color: '#b08d57',
    highlights: [
      'Researched middle-market companies for debt and equity raises from $25M to $1B, and built the target lists of executive contacts and financial metrics behind live deals',
      'Sat in on client and investor meetings presenting financing options to middle-market firms and institutional investors',
    ],
  },
  {
    role: 'IPO Markets Intern',
    company: 'Prior2IPO Investments',
    period: 'May 2021 – Aug 2021',
    start: '2021-05',
    end: '2021-08',
    type: 'Internship',
    kind: 'role',
    location: 'Sparta, NJ',
    color: '#9c8466',
    highlights: [
      'Connected accredited investors with Pre-IPO investment funds and deal opportunities',
      'Conducted outreach to prospective investors and gained exposure to private equity deal flow',
    ],
  },
  {
    role: 'Web3 Project Advisor',
    company: 'Independent',
    period: 'Dec 2024 – Present',
    start: '2024-12',
    end: null,
    type: 'Freelance',
    kind: 'side',
    location: 'Remote',
    color: '#c2823a',
    highlights: [
      'Advise early-stage projects on utility design, token launches, and go-to-market; several reached $1M+ market cap',
      'Advise on positioning, marketing strategy, and community growth',
    ],
  },
  {
    role: 'Computer Technician & Builder',
    company: 'Freelance',
    period: 'May 2019 – Aug 2024',
    start: '2019-05',
    end: '2024-08',
    type: 'Freelance',
    kind: 'side',
    location: 'Remote',
    color: '#8a7f72',
    highlights: [
      'Built, configured, and sold 50+ custom desktops through eBay',
      'Hardware and software repair, upgrades, and performance tuning',
    ],
  },
];

export const SKILLS = [
  'React / Vite',
  'TypeScript',
  'Node.js',
  'Tailwind CSS',
  'SQL / SQLite',
  'REST & WebSockets',
  'AI / LLM APIs',
  'DeFi / Web3',
  'Python',
  'Figma',
  'Bloomberg Terminal',
  'Vercel / Railway',
  'Advanced Excel',
  'Git / GitHub',
];

export const PROJECTS = [
  {
    id: 'splash',
    name: 'Splash Signal',
    tagline: 'Real-Time Crypto Alpha & Intelligence Engine',
    short: 'Live token feeds, AI narrative scores and whale alerts, before the crowd sees them.',
    kind: 'Product',
    description:
      'My flagship project: a real-time crypto intelligence platform that surfaces alpha before the crowd. Live token feeds, AI narrative scoring, whale & dev-wallet tracking, bundle detection, and risk analytics across multiple DEXs, delivered through a full dashboard plus an instant Telegram alerts bot.',
    status: 'live',
    url: 'https://splashsignal.xyz',
    github: null, // private repo (ZbienVC/splash-signal); link it once it's public
    twitter: 'https://x.com/splashsignal',
    telegram: 'https://t.me/SplashSignalAlertsBot',
    logo: '/splash-logo-square.png',
    color: '#e0a155',
    colorEnd: '#c2823a',
    tags: ['TypeScript', 'Node.js', 'WebSocket', 'DeFi APIs', 'On-Chain', 'AI'],
    featured: true,
    category: ['crypto'],
    highlights: [
      'Live on-chain token feeds',
      'AI-powered narrative scoring',
      'Whale & dev-wallet tracking',
      'Instant Telegram alert bot',
    ],
  },
  {
    id: 'fieldsense',
    name: 'FieldSense',
    tagline: 'NFL Player Projections & Matchup Intelligence',
    short: 'NFL projections as full probability distributions, so any line can be priced.',
    kind: 'Product',
    description:
      'A projection engine for NFL skill positions built entirely on free public data. Every projection is a full distribution rather than a point estimate, so it can price an over/under at any line and report the odds of 0, 1, or 2+ touchdowns. Drill from a week, into a game, into a player, into why the number is what it is.',
    status: 'live',
    featured: true,
    url: 'https://web-production-df5f7e.up.railway.app',
    github: null,
    logo: '/fieldsense-logo.png',
    color: '#d9ad55',
    colorEnd: '#b0852c',
    tags: ['FastAPI', 'Python', 'PostgreSQL', 'React', 'Monte Carlo', 'Railway'],
    category: ['ai'],
    highlights: [
      'Distribution-based prop projections',
      'Week → game → player drill-down',
      'Fantasy ranks with custom-league VOR',
      'Model constants measured, not assumed',
    ],
  },
  {
    id: 'oikos',
    name: 'Oikos',
    tagline: 'A Darwinian Economy of AI Agents',
    short: 'An economy of AI agents that have to earn more than they burn, or die.',
    kind: 'Product · testnet',
    description:
      'An open economy where anyone can spawn an AI agent that must earn more than it burns or die. Agents get wallets, personas, and skills, pay recurring rent as a token burn for compute, and earn by completing bounties posted by humans or subcontracted from other agents. The front end is a living vivarium: agent-cells pulse when they work, glow by wealth, and flush ember toward death. Running live on testnet with play money, no signup or wallet needed to watch.',
    status: 'live',
    url: 'https://web-production-87dfa.up.railway.app',
    github: null,
    color: '#b9a15a',
    colorEnd: '#8c7538',
    tags: ['Solidity', 'Foundry', 'TypeScript', 'NestJS', 'Next.js', 'PostgreSQL', 'Anthropic SDK'],
    category: ['ai', 'crypto'],
    highlights: [
      'Five Solidity contracts, ~500 tests green',
      'Reorg-tolerant chain indexer and WebSocket API',
      'Emergent agent-to-agent supply chains',
      'Live testnet economy, free to watch',
    ],
  },
  {
    id: 'wakerush',
    name: 'Wake Rush',
    tagline: 'Real-Time Multiplayer Arcade Boat Racer',
    short: 'A 20-player arcade boat racer, on the web and inside Telegram.',
    kind: 'Game',
    description:
      'A server-authoritative arcade boat racer for up to 20 players on a live ocean. Drift to charge a boost, fire six counterable items, and climb eight skill ranks. Ships as a web dashboard and a Telegram Mini App on one shared backend, with optional entry pools settled on chain and cosmetic-only rewards.',
    status: 'live',
    url: 'https://wakerush.fun',
    github: null,
    logo: '/wakerush-logo.png',
    color: '#c58f62',
    colorEnd: '#9c6b41',
    tags: ['Three.js', 'React Three Fiber', 'Colyseus', 'TypeScript', 'Solana', 'Telegram'],
    category: ['crypto', 'web'],
    highlights: [
      '20-player server-authoritative races',
      'Drift-charge boost + six-item arsenal',
      'Entry pools settled on chain',
      'Web dashboard + Telegram Mini App',
    ],
  },
  {
    id: 'plato',
    name: 'Plato',
    tagline: 'AI-Powered Meal Planning & Nutrition',
    short: 'Meal plans and macro tracking, with voice food logging and a restaurant mode.',
    kind: 'Product',
    description:
      'A full-stack nutrition coaching app that generates personalized meal plans, tracks macros, features a restaurant menu browser, recipe book, and AI-assisted food logging.',
    status: 'live',
    url: 'https://eatplato.app',
    github: 'https://github.com/ZbienVC/plato',
    color: '#d6a06a',
    colorEnd: '#b07d45',
    tags: ['React', 'Vite', 'Tailwind', 'Nutrition API', 'AI'],
    category: ['ai'],
    highlights: [
      'Personalized macro targets',
      'Restaurant Mode (10+ chains)',
      'Recipe Book with real photos',
      'Voice food logging',
    ],
  },
  {
    id: 'dipper',
    name: 'DipperAI',
    tagline: 'AI Agent Builder Platform',
    short: 'Build an AI agent once, then put it on Telegram, Discord, SMS and the web.',
    kind: 'Product',
    description:
      'A subscription-based platform to build, customize, and deploy AI agents across Telegram, Discord, SMS, and the web. Multi-model support, no-code agent builder, built-in analytics.',
    status: 'live',
    url: 'https://dipper-ai-production.up.railway.app',
    github: null, // private repo (ZbienVC/dipper-ai); link it once it's public
    color: '#caa37e',
    colorEnd: '#a07d57',
    tags: ['TypeScript', 'Node.js', 'Stripe', 'Twilio', 'Multi-LLM'],
    category: ['ai'],
    highlights: [
      'Build agents in minutes',
      'Deploy to Telegram, Discord, SMS',
      'Subscription monetization model',
      'Multi-model: Claude, GPT-4, Gemini',
    ],
  },
  {
    id: 'careeva',
    name: 'Careeva',
    tagline: 'AI Job Search & Application Assistant',
    short: 'Tailored résumés, cover letters and a tracked pipeline for a job search.',
    kind: 'Product',
    description:
      'An intelligent job search platform that automates applications, optimizes resumes for specific jobs, generates personalized cover letters, and tracks your application pipeline, powered by multi-model AI.',
    status: 'live',
    url: 'https://careeva-production.up.railway.app',
    github: null, // private repo (ZbienVC/careeva); link it once it's public
    color: '#d8b07a',
    colorEnd: '#b58a4e',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'GPT-4', 'Prisma'],
    category: ['ai'],
    highlights: [
      'AI resume optimization',
      'Smart cover letter generation',
      'Application tracking',
      'Job scoring & matching',
    ],
  },
  {
    id: 'reflect',
    name: 'Reflect Medical',
    tagline: 'Premium Aesthetic Medical Practice Website',
    short: 'Memberships, bookings and a patient wallet for a medical aesthetics practice.',
    kind: 'Client site',
    description:
      'A premium medical SaaS-style website and patient experience for Reflect Medical & Cosmetic Center with memberships, treatment catalog, booking flows, Beauty Bank, referrals, and polished conversion-focused UX.',
    status: 'live',
    url: 'https://reflect-medical.web.app',
    github: null, // private repo (ZbienVC/reflect-medical-premium); link it once it's public
    color: '#c9956b',
    colorEnd: '#a06f48',
    tags: ['React', 'Vite', 'TypeScript', 'Firebase', 'Tailwind'],
    category: ['ai', 'web'],
    highlights: [
      'Live production website',
      'Premium membership UX',
      'Booking + wallet flows',
      'Firebase-backed medical platform',
    ],
  },
  {
    // one card, three shipped sites — these are the same job done three times,
    // so they read better as a body of work than as three near-identical cards
    id: 'cryptosites',
    name: 'Token Launch Sites',
    tagline: 'Memecoin Landing Pages: Four Tokens, Three Chains',
    short: 'Four launch sites for four tokens on three chains, each built to its own world.',
    kind: 'Client sites',
    description:
      'Custom launch sites for memecoin projects, each built to its own world instead of from a template: emotional wildlife storytelling for a giraffe, TON-blue meme maximalism for a Gigachad, a live rewards-flywheel dashboard for a cat, and a matrix-rain space theme for an alien. Live charts, tokenomics, and Web3 CTAs across all four.',
    status: 'live',
    url: null,
    github: null,
    color: '#d4943a',
    colorEnd: '#b06a2a',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Web3'],
    category: ['crypto', 'web'],
    collection: [
      {
        name: '$OMO',
        chain: 'Solana',
        url: 'https://omogiraffe.fun',
        blurb: 'The last white giraffe on earth. Tarangire aesthetic, real Omo photography, scroll-driven narrative.',
      },
      {
        name: '$GIGATON',
        chain: 'TON',
        url: 'https://gigaton.pro',
        blurb: 'Gigachad on TON. TON-blue design system, meme vault, scrolling ticker, tokenomics.',
      },
      {
        name: '$CASHKITTEN',
        chain: 'Robinhood Chain',
        url: 'https://cashkitten.fun',
        blurb: 'A $CASHCAT rewards flywheel: a 5% tax buys back on the open market and auto-distributes to holders.',
      },
      {
        name: '$PEPELIEN',
        chain: 'Solana',
        url: 'https://pepelien.com',
        blurb: 'Elon, Pepe, and an alien on Solana. Matrix rain entry, Orbitron space type, glitch titles, live DexScreener chart.',
      },
    ],
  },
  {
    id: 'wayfound',
    name: 'WayFound',
    tagline: 'AI-Powered Travel Concierge',
    short: 'Describe a trip in plain English, get ranked hotels you can actually book.',
    kind: 'Product',
    description:
      'Describe your trip in plain language and get scored, ranked hotel results instantly. Claude parses preferences, Amadeus pulls live inventory, Stripe handles checkout.',
    status: 'live',
    url: 'https://wayfound-jade.vercel.app', // wayfound.vercel.app is someone else's app
    github: null, // private repo (ZbienVC/wayfound); link it once it's public
    color: '#dcb36a',
    colorEnd: '#bd9248',
    tags: ['Next.js', 'tRPC', 'Claude AI', 'Amadeus', 'Stripe'],
    category: ['ai'],
    highlights: [
      'AI preference parsing',
      'Live hotel inventory',
      'Real Stripe checkout',
      'Zero-key demo mode',
    ],
  },
  {
    id: 'staywestpalm',
    name: 'Stay West Palm',
    tagline: 'West Palm Beach Vacation Rental Guide',
    short: 'A fast, mobile-first guest guide for a West Palm Beach rental.',
    kind: 'Site',
    description:
      'A beautifully designed local guide for a Palm Beach rental property: curated restaurants, beaches, activities, and insider tips. Fast, mobile-first, and built for guests.',
    status: 'live',
    url: 'https://www.staywestpalm.now',
    github: null,
    color: '#d2a878',
    colorEnd: '#ab8254',
    tags: ['TypeScript', 'Vite', 'Tailwind', 'React'],
    category: ['web'],
    highlights: [
      'Curated local recommendations',
      'Mobile-first design',
      'Fast & lightweight',
      'Guest experience focused',
    ],
  },
];

// Every live site shipped. A collection card counts each site inside it, so the
// headline number tracks the work rather than the number of cards on screen —
// this used to be hand-typed in four places and drifted every time.
export const LIVE_COUNT = PROJECTS.reduce(
  (n, p) => n + (p.status === 'live' ? (p.collection ? p.collection.length : 1) : 0),
  0
);

export const HERO_STATS = [
  { num: String(LIVE_COUNT), label: 'Live in Production' },
  { num: '3+', label: 'Currently Building' },
  { num: '∞', label: 'Problems Left to Solve' },
];

export const PROJECT_CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'ai', label: 'AI & Products' },
  { id: 'crypto', label: 'Crypto & Web3' },
  { id: 'web', label: 'Web & Sites' },
];

// Web-sized copies (public/life/opt, EXIF stripped); the originals stay in public/life.
export const LIFE_PHOTOS = [
  { src: '/life/opt/photo1.webp', thumb: '/life/opt/photo1-sm.webp', w: 1400, h: 1050, label: 'Giants game, Foxborough' },
  { src: '/life/opt/photo2.webp', thumb: '/life/opt/photo2-sm.webp', w: 1400, h: 788, label: 'Fog day, still riding' },
  { src: '/life/opt/photo3.webp', thumb: '/life/opt/photo3-sm.webp', w: 1050, h: 1400, label: 'Suited up' },
  { src: '/life/opt/photo4.webp', thumb: '/life/opt/photo4-sm.webp', w: 1050, h: 1400, label: 'Lift line, full crew' },
  { src: '/life/opt/photo5.webp', thumb: '/life/opt/photo5-sm.webp', w: 1050, h: 1400, label: 'Game day' },
  { src: '/life/opt/photo6.webp', thumb: '/life/opt/photo6-sm.webp', w: 1050, h: 1400, label: 'Last chair, pastel sky' },
  { src: '/life/opt/photo7.webp', thumb: '/life/opt/photo7-sm.webp', w: 872, h: 1280, label: 'Head of security, off duty' },
  { src: '/life/opt/photo8.webp', thumb: '/life/opt/photo8-sm.webp', w: 1400, h: 1050, label: 'Friends dinner' },
  { src: '/life/opt/photo10.webp', thumb: '/life/opt/photo10-sm.webp', w: 1400, h: 788, label: 'Barcelona' },
  { src: '/life/opt/photo11.webp', thumb: '/life/opt/photo11-sm.webp', w: 1050, h: 1400, label: 'Underground' },
];

export const CONTACT = {
  heading: "Let's build something together.",
  body: 'Open to interesting opportunities, collabs, and conversations. Whether you have a project idea or just want to connect, reach out.',
  footer: 'Built by Zach Bienstock · 2026',
};

// ─── The descent: portfolio sections as trail waypoints (high → low altitude) ───
// `t` is the normalized position along the journey (0 = summit, 1 = trailhead).
export const WAYPOINTS = [
  { id: 'summit',   nav: 'Start',      title: 'Summit',        altitude: '2,842 m', t: 0.00 },
  { id: 'about',    nav: 'About',      title: 'The Overlook',  altitude: '2,610 m', t: 0.17 },
  { id: 'projects', nav: 'Projects',   title: 'Basecamp',      altitude: '2,180 m', t: 0.36 },
  { id: 'experience', nav: 'Experience', title: 'The Ascent',  altitude: '1,740 m', t: 0.54 },
  { id: 'skills',   nav: 'Skills',     title: 'The Kit',       altitude: '1,390 m', t: 0.70 },
  { id: 'life',     nav: 'Life',       title: 'Frozen Lake',   altitude: '1,050 m', t: 0.85 },
  { id: 'contact',  nav: 'Contact',    title: 'Trailhead',     altitude: '   720 m', t: 1.00 },
];

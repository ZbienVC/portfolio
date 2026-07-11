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
    "I don't just want to know how things work — I want to make them work better.",
  intro:
    'Finance background from Bloomberg & Investment Banking, now building at the intersection of data, product, and AI.',
  resumeOnline: 'https://bold.pro/my/zachary-bienstock/354r',
  resumePdf: '/resume.pdf',
  resumePdfNamed: '/Zachary_Bienstock_Resume.pdf',
  email: 'Zbienstock@gmail.com',
  socials: {
    github: 'https://github.com/ZbienVC',
    linkedin: 'https://www.linkedin.com/in/zach-bienstock',
  },
};

export const HERO_STATS = [
  { num: '10', label: 'Live in Production' },
  { num: '3+', label: 'Currently Building' },
  { num: '∞', label: 'Problems Left to Solve' },
];

export const ABOUT = {
  quote:
    "I naturally operate at the intersection of data, creativity, and strategy. I'm at my best when I can take something complex or messy and turn it into something clearer, more usable, and more thoughtful.",
  quoteAccents: ['data', 'creativity', 'strategy'],
  paragraphs: [
    'Finance graduate from Rutgers who spent time analyzing derivatives at Bloomberg LP and supporting $25M–$1B capital raises at Cambridge Wilkinson before turning full attention to building software.',
    'That curiosity has been with me since long before formal roles — buying and selling online, building and fixing computers, learning how value is created and exchanged. I tend to think in systems rather than tasks. I ask where information comes from, what it represents in the real world, and how it could be better.',
    'Outside of work: deeply into crypto mechanics and incentive design, cognitive science and how attention works, and snowboarding — specifically the technical side of board design and performance optimization. That same mindset shows up in my work.',
  ],
  traits: [
    {
      title: 'Systems Thinker',
      body: 'I ask where data comes from, what it represents, and how confident we should be in it. Numbers should explain reality, not just look correct.',
    },
    {
      title: 'Builder by Nature',
      body: 'Long before formal roles — repairing computers, selling online, advising crypto launches. I learn by doing and care about ownership.',
    },
    {
      title: 'Impact Over Process',
      body: "I don't enjoy analysis that lives in isolation. Every insight should turn into a decision, a better experience, or a smarter system.",
    },
    {
      title: 'Precision & Iteration',
      body: 'Drawn to the technical details. Snowboard geometry, ML model validation, product design — I care about why things work, not just that they do.',
    },
  ],
  education: {
    degree: 'B.S. Finance — Business Analytics',
    school: 'Rutgers University, New Brunswick',
    cert: 'SQL Cert — UC Davis',
    date: 'Dec 2022',
  },
};

export const EXPERIENCE = [
  {
    role: 'Savings Analyst & Sales Engineer',
    company: 'Grapevine',
    period: 'Feb 2024 – Oct 2025',
    location: 'New York, NY',
    color: '#e0a155',
    highlights: [
      'Built automated Excel reporting systems and Figma dashboards, reducing manual reporting by 80%+',
      'Analyzed tens of thousands of product groups — generated 20–85% cost savings, ranging from tens of thousands to millions annually',
      'Resolved 50+ weekly supply backorders; assisted with client onboarding, vendor integration, and system setup',
    ],
  },
  {
    role: 'Operations & Marketing Coordinator',
    company: 'Reflect Medical & Cosmetic Center',
    period: 'Jul 2023 – Present',
    location: 'Hawthorne, NJ',
    color: '#c98a5e',
    highlights: [
      'Managed financial workflows in QuickBooks: transaction entry, reconciliation, expense tracking',
      'Oversaw inventory procurement and vendor coordination for consistent medical supply availability',
      'Designed marketing materials, social media assets, and promotional graphics using Canva',
    ],
  },
  {
    role: 'Financial Data Analyst — Surveillance & Threat Detection',
    company: 'Bloomberg LP',
    period: 'Mar 2023 – Feb 2024',
    location: 'Remote',
    color: '#d4a373',
    highlights: [
      'Analyzed large financial datasets to identify trends and support ML surveillance models',
      'Evaluated derivatives activity — options, swaps, forwards — to validate structured financial data',
      'Collaborated with senior analysts to improve AI-based trade surveillance and threat detection systems',
    ],
  },
  {
    role: 'Investment Banking Intern',
    company: 'Cambridge Wilkinson',
    period: 'Feb 2022 – Feb 2023',
    location: 'New York, NY',
    color: '#b08d57',
    highlights: [
      'Researched middle-market companies to support debt and equity capital raises ($25M – $1B)',
      'Built detailed target lists of executives and financial metrics for active deal sourcing',
      'Supported investor presentations and discussions with institutional clients',
    ],
  },
  {
    role: 'IPO Markets Intern',
    company: 'Prior2IPO Investments',
    period: 'May 2021 – Aug 2021',
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
    period: 'May 2019 – Aug 2024',
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
    period: 'Dec 2024 – Present',
    location: 'Remote',
    color: '#c2823a',
    highlights: [
      'Advise early-stage Web3 projects on token design, positioning, marketing strategy, and community growth',
      'Guide go-to-market strategies and token launches reaching meaningful market capitalization',
      'Provide insights on crypto market dynamics, narrative positioning, and digital community engagement',
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
    description:
      'My flagship project — a real-time crypto intelligence platform that surfaces alpha before the crowd. Live token feeds, AI narrative scoring, whale & dev-wallet tracking, bundle detection, and risk analytics across multiple DEXs — delivered through a full dashboard plus an instant Telegram alerts bot.',
    status: 'live',
    url: 'https://splashsignal.xyz',
    github: 'https://github.com/ZbienVC/splash-signal',
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
    id: 'plato',
    name: 'Plato',
    tagline: 'AI-Powered Meal Planning & Nutrition',
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
    description:
      'A subscription-based platform to build, customize, and deploy AI agents across Telegram, Discord, SMS, and the web. Multi-model support, no-code agent builder, built-in analytics.',
    status: 'live',
    url: 'https://dipper-ai-production.up.railway.app',
    github: 'https://github.com/ZbienVC/dipper-ai',
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
    description:
      'An intelligent job search platform that automates applications, optimizes resumes for specific jobs, generates personalized cover letters, and tracks your application pipeline — powered by multi-model AI.',
    status: 'live',
    url: 'https://careeva-production.up.railway.app',
    github: 'https://github.com/ZbienVC/careeva',
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
    description:
      'A premium medical SaaS-style website and patient experience for Reflect Medical & Cosmetic Center with memberships, treatment catalog, booking flows, Beauty Bank, referrals, and polished conversion-focused UX.',
    status: 'live',
    url: 'https://reflect-medical.web.app',
    github: 'https://github.com/ZbienVC/reflect-medical-premium',
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
    id: 'omo',
    name: '$OMO',
    tagline: 'Memecoin Landing Page — The Last White Giraffe',
    description:
      'A fully custom memecoin landing site for $OMO — the last white giraffe on earth. Emotional storytelling, Tarangire/Tanzania aesthetic, live DexScreener chart embed, real Omo photography, and Web3 CTAs.',
    status: 'live',
    url: 'https://omogiraffe.fun',
    github: 'https://github.com/ZbienVC/omo-token',
    color: '#d4943a',
    colorEnd: '#b06a2a',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Web3'],
    category: ['crypto', 'web'],
    highlights: [
      'Real Omo giraffe photography',
      'Live DexScreener chart',
      'Tarangire Africa aesthetic',
      'Emotional scroll-driven narrative',
    ],
  },
  {
    id: 'gigaton',
    name: '$GIGATON',
    tagline: 'Gigachad on TON — Memecoin Website',
    description:
      'A fully custom memecoin landing site for $GIGATON on the TON blockchain. TON-blue design, Gigachad meme gallery, live DexScreener chart, scrolling ticker, and tokenomics.',
    status: 'live',
    url: 'https://gigaton.pro',
    github: 'https://github.com/ZbienVC/gigaton-token',
    color: '#c2a06a',
    colorEnd: '#9c7e4e',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'TON'],
    category: ['crypto', 'web'],
    highlights: [
      'TON blue design system',
      'Live DexScreener chart',
      'Gigachad meme vault',
      'Scrolling ticker + tokenomics',
    ],
  },
  {
    id: 'wayfound',
    name: 'WayFound',
    tagline: 'AI-Powered Travel Concierge',
    description:
      'Describe your trip in plain language and get scored, ranked hotel results instantly. Claude parses preferences, Amadeus pulls live inventory, Stripe handles checkout.',
    status: 'live',
    url: 'https://wayfound.vercel.app',
    github: 'https://github.com/ZbienVC/wayfound',
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
    id: 'pepelien',
    name: '$PEPELIEN',
    tagline: 'Elon. Pepe. Alien. On Solana.',
    description:
      'A fully custom memecoin website for $PEPELIEN on Solana. Space/alien theme, Orbitron font, matrix rain + particle burst effects, Gigachad meme vault, live DexScreener chart, and full Web3 CTAs.',
    status: 'live',
    url: 'https://pepelien.com',
    github: 'https://github.com/ZbienVC/pepelien',
    color: '#cda06a',
    colorEnd: '#a87f4e',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Solana'],
    category: ['crypto'],
    highlights: [
      'Matrix rain + particle burst entry',
      'Orbitron space font system',
      'Glitch title effect',
      'Live Solana chart embed',
    ],
  },
  {
    id: 'staywestpalm',
    name: 'Stay West Palm',
    tagline: 'West Palm Beach Vacation Rental Guide',
    description:
      'A beautifully designed local guide for a Palm Beach rental property — curated restaurants, beaches, activities, and insider tips. Fast, mobile-first, and built for guests.',
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

export const PROJECT_CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'ai', label: 'AI & Products' },
  { id: 'crypto', label: 'Crypto & Web3' },
  { id: 'web', label: 'Web & Sites' },
];

export const LIFE_PHOTOS = [
  { src: '/life/photo1.jpeg', label: 'Living life' },
  { src: '/life/photo2.jpg', label: 'Moments' },
  { src: '/life/photo3.jpeg', label: 'Adventures' },
  { src: '/life/photo4.jpeg', label: 'Vibes' },
  { src: '/life/photo5.jpeg', label: 'Good times' },
  { src: '/life/photo6.jpeg', label: 'The journey' },
  { src: '/life/photo7.jpg', label: 'Life' },
  { src: '/life/photo8.jpg', label: 'Friends dinner' },
];

export const CONTACT = {
  heading: "Let's build something together.",
  body: 'Open to interesting opportunities, collabs, and conversations. Whether you have a project idea or just want to connect — reach out.',
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

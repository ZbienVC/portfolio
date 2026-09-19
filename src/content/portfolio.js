// ─────────────────────────────────────────────────────────────────────────────
// Portfolio content — single source of truth.
// Started from the v1 editorial site (backup branch: backup/editorial-site-v1) and
// edited since into plain, first-person wording. The classic site, the 3D basecamp,
// the chat (api/chat.js) and llms.txt all read from here.
// ─────────────────────────────────────────────────────────────────────────────

export const PROFILE = {
  name: 'Zach Bienstock',
  first: 'Zach',
  last: 'Bienstock',
  roles: ['builder', 'developer', 'founder', 'creator'],
  title: 'Finance, operations and software',
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
    "I like problems that need data, creativity and strategy all at once. I'm at my best taking something complex or messy and making it clearer and easier to use.",
  quoteAccents: ['data', 'creativity', 'strategy'],
  paragraphs: [
    'I studied finance at Rutgers, then worked on $25M to $1B capital raises at Cambridge Wilkinson and analyzed derivatives at Bloomberg LP. Now I run the books for two telecom companies and build software on my own time.',
    "I was building and fixing computers and selling things online before I had a job title. I still think about work as a system: where the information comes from, what it means in the real world, and how it could be better.",
    "Outside work I'm deep into crypto mechanics and incentive design, cognitive science and how attention works, and snowboarding. With snowboards it's the technical side I like: how a board is designed and what makes it ride better.",
  ],
  traits: [
    {
      title: 'Systems thinker',
      body: 'I ask where data comes from, what it stands for and how much to trust it. Numbers should explain what really happened.',
    },
    {
      title: 'Hands on',
      body: "On the side I've repaired computers, sold things online and advised crypto launches. I learn by doing, and I like owning the result.",
    },
    {
      title: 'Analysis that gets used',
      body: "I don't enjoy analysis nobody acts on. I want each finding to change a decision, make something easier to use, or improve a system.",
    },
    {
      title: 'Precision',
      body: "I'm drawn to technical detail: snowboard geometry, validating ML models, product design. I want to know why something works.",
    },
  ],
  education: {
    degree: 'B.S. Finance, Business Analytics',
    school: 'Rutgers University, New Brunswick',
    cert: 'SQL Cert, UC Davis',
    date: 'Dec 2022',
  },
};

// Facts, numbers and dates follow the résumés (public/*.pdf, updated 2026-09-18);
// a few bullets are reworded to read better on a web page.
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
      'Built the internal platform the rest of it runs on, plus FCC Form 499-Q reporting pulled from billing data and revenue and margin tracking by carrier. Built solo, using AI coding tools',
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
      'Worked through tens of thousands of product groups to find substitutions, saving clients 20 to 85%, worth thousands to millions a year per client',
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
      'Reached out to prospective investors and saw private equity deal flow up close',
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
    tagline: 'Real-time crypto signals and alerts',
    short: 'Live token feeds, AI narrative scores and whale alerts, before the crowd sees them.',
    kind: 'Product',
    description:
      'A crypto tool for spotting tokens early. It follows token activity live across several DEXs, has an AI score the story behind each token, tracks whale and developer wallets, detects bundles and rates the risk. It all shows up on a dashboard, and a Telegram bot sends the alerts as they happen.',
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
      'Live token feeds from the chain',
      "AI scores for each token's narrative",
      'Whale and dev-wallet tracking',
      'Telegram alerts as they happen',
    ],
  },
  {
    id: 'fieldsense',
    name: 'FieldSense',
    tagline: 'NFL player projections and matchups',
    short: 'NFL player projections with the full range of outcomes, so it can price any over/under.',
    kind: 'Product',
    description:
      'Projections for NFL skill positions, built entirely on free public data. Each one is a full range of outcomes with odds attached, so it can price an over/under at any line and give the chances of 0, 1, or 2+ touchdowns. You can drill from a week into a game, into a player, and into why the number is what it is.',
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
      'Prices player props at any line',
      'Drill from a week to a game to a player',
      "Fantasy rankings for your league's settings",
      'Model constants measured from the data',
    ],
  },
  {
    id: 'oikos',
    name: 'Oikos',
    tagline: 'A Darwinian economy of AI agents',
    short: 'An economy of AI agents that have to earn more than they burn, or die.',
    kind: 'Product · testnet',
    description:
      'An open economy where anyone can spawn an AI agent, and every agent has to earn more than it burns or it dies. Agents get a wallet, a persona and skills. They pay rent for their compute by burning tokens, and earn by finishing bounties that people post or that other agents subcontract to them. On screen it looks like a vivarium: each agent is a cell that pulses while it works, glows brighter the richer it gets, and flushes ember as it nears death. It runs live on a testnet with play money, and you can watch without signing up or connecting a wallet.',
    status: 'live',
    url: 'https://web-production-87dfa.up.railway.app',
    github: null,
    color: '#b9a15a',
    colorEnd: '#8c7538',
    tags: ['Solidity', 'Foundry', 'TypeScript', 'NestJS', 'Next.js', 'PostgreSQL', 'Anthropic SDK'],
    category: ['ai', 'crypto'],
    highlights: [
      'Agents hire each other, and supply chains form on their own',
      'Live on a testnet, free to watch',
      'Five Solidity contracts, about 500 passing tests',
      'A chain indexer that survives reorgs, plus a WebSocket API',
    ],
  },
  {
    id: 'wakerush',
    name: 'Wake Rush',
    tagline: 'A multiplayer arcade boat racer',
    short: 'A 20-player arcade boat racer, on the web and inside Telegram.',
    kind: 'Game',
    description:
      'An arcade boat racer for up to 20 players on a live ocean. Drift to charge a boost, fire six items that can each be countered, and climb eight skill ranks. The server referees every race. You can play from the web dashboard or the Telegram Mini App, which share one backend. Entry pools are optional and settle on chain, and the rewards are cosmetic only.',
    status: 'live',
    url: 'https://wakerush.fun',
    github: null,
    logo: '/wakerush-logo.png',
    color: '#c58f62',
    colorEnd: '#9c6b41',
    tags: ['Three.js', 'React Three Fiber', 'Colyseus', 'TypeScript', 'Solana', 'Telegram'],
    category: ['crypto', 'web'],
    highlights: [
      'Races of up to 20, refereed by the server',
      'Drift to charge a boost, with six items to fire',
      'Play on the web or inside Telegram',
      'Optional entry pools, settled on chain',
    ],
  },
  {
    id: 'plato',
    name: 'Plato',
    tagline: 'Meal planning and macro tracking',
    short: 'Meal plans and macro tracking, with voice food logging and a restaurant mode.',
    kind: 'Product',
    description:
      "A nutrition coaching app. It builds meal plans around your macro targets, tracks what you eat, and helps you log food with AI, including by voice. There's a recipe book with real photos and a restaurant mode with menus from 10+ chains.",
    status: 'live',
    url: 'https://eatplato.app',
    github: 'https://github.com/ZbienVC/plato',
    color: '#d6a06a',
    colorEnd: '#b07d45',
    tags: ['React', 'Vite', 'Tailwind', 'Nutrition API', 'AI'],
    category: ['ai'],
    highlights: [
      'Macro targets set for you',
      'Menus from 10+ restaurant chains',
      'A recipe book with real photos',
      'Food logging by voice',
    ],
  },
  {
    id: 'dipper',
    name: 'DipperAI',
    tagline: 'Build AI agents without code',
    short: 'Build an AI agent once, then put it on Telegram, Discord, SMS and the web.',
    kind: 'Product',
    description:
      'Build and customize an AI agent without writing code, then put it to work on Telegram, Discord, SMS or the web. It supports several models, has analytics built in, and runs on subscriptions.',
    status: 'live',
    url: 'https://dipper-ai-production.up.railway.app',
    github: null, // private repo (ZbienVC/dipper-ai); link it once it's public
    color: '#caa37e',
    colorEnd: '#a07d57',
    tags: ['TypeScript', 'Node.js', 'Stripe', 'Twilio', 'Multi-LLM'],
    category: ['ai'],
    highlights: [
      'Set up an agent in minutes',
      'Runs on Telegram, Discord and SMS',
      'Works with Claude, GPT-4 and Gemini',
      'Paid plans by subscription',
    ],
  },
  {
    id: 'careeva',
    name: 'Careeva',
    tagline: 'A job search assistant',
    short: 'Tailors your résumé and cover letter to each job, and tracks every application.',
    kind: 'Product',
    description:
      'It automates applications, tailors your résumé to each job, writes a cover letter for it, scores how well you match, and keeps track of where every application stands. Several AI models do the work behind it.',
    status: 'live',
    url: 'https://careeva-production.up.railway.app',
    github: null, // private repo (ZbienVC/careeva); link it once it's public
    color: '#d8b07a',
    colorEnd: '#b58a4e',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'GPT-4', 'Prisma'],
    category: ['ai'],
    highlights: [
      'A résumé tailored to each job',
      'Cover letters written for the role',
      'Scores how well you match',
      'Tracks every application',
    ],
  },
  {
    id: 'reflect',
    name: 'Reflect Medical',
    tagline: 'Website for a medical aesthetics practice',
    short: 'Memberships, bookings and a patient wallet for a medical aesthetics practice.',
    kind: 'Client site',
    description:
      "The website for Reflect Medical & Cosmetic Center, the practice where I also worked in operations and marketing. Patients can browse treatments, book, join a membership, refer friends, and keep a balance in the Beauty Bank, the practice's patient wallet. It's built to turn visitors into booked patients.",
    status: 'live',
    url: 'https://reflect-medical.web.app',
    github: null, // private repo (ZbienVC/reflect-medical-premium); link it once it's public
    color: '#c9956b',
    colorEnd: '#a06f48',
    tags: ['React', 'Vite', 'TypeScript', 'Firebase', 'Tailwind'],
    category: ['ai', 'web'],
    highlights: [
      "The practice's live website",
      'Memberships and referrals',
      'Booking and the Beauty Bank wallet',
      'Built on Firebase',
    ],
  },
  {
    // one card, three shipped sites — these are the same job done three times,
    // so they read better as a body of work than as three near-identical cards
    id: 'cryptosites',
    name: 'Token Launch Sites',
    tagline: 'Memecoin launch sites: four tokens, three chains',
    short: 'Four memecoin launch sites on three chains, each designed around its token.',
    kind: 'Client sites',
    description:
      'Launch sites for four memecoins, each designed around its token instead of a template. The giraffe got a story told through real photos of Omo, the Gigachad got TON blue and wall-to-wall memes, the cat got a live dashboard for its rewards flywheel, and the alien got matrix rain and space type. All four have live charts and tokenomics.',
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
        blurb: 'Omo, the last white giraffe on earth. Real photos of Omo, the look of Tarangire, and a story that plays out as you scroll.',
      },
      {
        name: '$GIGATON',
        chain: 'TON',
        url: 'https://gigaton.pro',
        blurb: 'Gigachad on TON: everything in TON blue, a vault of memes, a scrolling ticker and the tokenomics.',
      },
      {
        name: '$CASHKITTEN',
        chain: 'Robinhood Chain',
        url: 'https://cashkitten.fun',
        blurb: 'A $CASHCAT rewards flywheel: a 5% tax buys back on the open market, and it all goes out to holders automatically.',
      },
      {
        name: '$PEPELIEN',
        chain: 'Solana',
        url: 'https://pepelien.com',
        blurb: 'Elon, Pepe and an alien on Solana. You enter through matrix rain, then get Orbitron space type, glitching titles and a live DexScreener chart.',
      },
    ],
  },
  {
    id: 'wayfound',
    name: 'WayFound',
    tagline: 'Hotel search in plain English',
    short: 'Describe a trip in plain English, get ranked hotels you can actually book.',
    kind: 'Product',
    description:
      "Describe your trip in plain language and get hotels back, scored and ranked, right away. Claude works out what you're asking for, Amadeus supplies live inventory, and checkout runs on Stripe.",
    status: 'live',
    url: 'https://wayfound-jade.vercel.app', // wayfound.vercel.app is someone else's app
    github: null, // private repo (ZbienVC/wayfound); link it once it's public
    color: '#dcb36a',
    colorEnd: '#bd9248',
    tags: ['Next.js', 'tRPC', 'Claude AI', 'Amadeus', 'Stripe'],
    category: ['ai'],
    highlights: [
      'Claude reads what you want',
      'Live hotel inventory from Amadeus',
      'Real checkout through Stripe',
      'A demo mode that needs no API keys',
    ],
  },
  {
    id: 'staywestpalm',
    name: 'Stay West Palm',
    tagline: 'West Palm Beach rental guide',
    short: 'A fast guest guide for a West Palm Beach rental, made for phones.',
    kind: 'Site',
    description:
      'A local guide for guests at a West Palm Beach rental: restaurants, beaches, things to do and local tips. It loads fast and is made to read on a phone.',
    status: 'live',
    url: 'https://www.staywestpalm.now',
    github: null,
    color: '#d2a878',
    colorEnd: '#ab8254',
    tags: ['TypeScript', 'Vite', 'Tailwind', 'React'],
    category: ['web'],
    highlights: [
      'Restaurants, beaches and things to do',
      'Made for phones first',
      'Small and quick to load',
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
  { id: 'all', label: 'Everything' },
  { id: 'ai', label: 'AI & data' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'web', label: 'Sites & games' },
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
  heading: 'Got a process someone still does by hand?',
  body: "Or numbers that don't tie out, or a product that should exist and doesn't. Those are my favorite problems. Write to me, I answer.",
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

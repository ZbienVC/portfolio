/**
 * The classic site's view of the shared content (src/content/portfolio.js).
 * Everything here is derived from that module: counts, the status-board
 * targets, the tool matrix. Nothing is typed in twice.
 */
import {
  ABOUT,
  EXPERIENCE as RAW_EXPERIENCE,
  LIFE_PHOTOS as RAW_PHOTOS,
  LIVE_COUNT as RAW_LIVE_COUNT,
  PROFILE as RAW_PROFILE,
  PROJECTS as RAW_PROJECTS,
} from '@/content/portfolio.js';

export interface SiteLink {
  name: string;
  chain: string;
  url: string;
  blurb: string;
  launched?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  short: string;
  kind: string;
  description: string;
  status: string;
  url: string | null;
  github: string | null;
  twitter?: string;
  telegram?: string;
  logo?: string;
  color: string;
  tags: string[];
  category: string[];
  highlights?: string[];
  collection?: SiteLink[];
  featured?: boolean;
  /** first deployed, ISO date (from the hosting provider's creation date) */
  launched?: string;
}

export interface Role {
  role: string;
  company: string;
  period: string;
  start: string;
  end: string | null;
  type: string;
  kind: 'role' | 'side';
  location: string;
  highlights: string[];
}

export const PROFILE = RAW_PROFILE;
export const EDUCATION = ABOUT.education;
export const PROJECTS = RAW_PROJECTS as unknown as Project[];
export const LIVE_COUNT: number = RAW_LIVE_COUNT;
const EXPERIENCE = RAW_EXPERIENCE as unknown as Role[];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);

/* ── Work ─────────────────────────────────────────────────────────────────── */

// The four the résumé leads with, in the order they read best side by side.
export const FLAGSHIP_IDS = ['fieldsense', 'oikos', 'splash', 'wakerush'] as const;
export const FLAGSHIPS = FLAGSHIP_IDS.map((id) => projectById(id)!);
export const ALSO_SHIPPED = PROJECTS.filter((p) => !(FLAGSHIP_IDS as readonly string[]).includes(p.id));

/* ── The stage: eight projects with recorded demos, shown running ─────────── */

// Each one gets a different "how it works" strip, so the eight don't read as one card repeated.
export type Signature =
  | { kind: 'chain'; label: string; steps: string[]; end?: string }
  | { kind: 'split'; left: { k: string; v: string }; right: { k: string; v: string }; link: string }
  | { kind: 'figures'; items: { n: string; label: string }[] };

export interface StageItem {
  id: string;
  /** one line on what makes it different */
  hook: string;
  signature: Signature;
}

// newest first: the four latest builds, then the four the résumé leads with
export const STAGE: StageItem[] = [
  {
    id: 'hookline',
    hook: 'Six AI agents in a row turn a rising trend into a finished vertical video, and a trust ladder decides how much they post on their own.',
    signature: { kind: 'chain', label: 'How a video gets made', steps: ['Scout', 'Analyst', 'Strategist', 'Writer', 'Critic', 'Director'], end: '1080×1920 MP4' },
  },
  {
    id: 'feast',
    hook: 'A full board game in the browser: the TV runs the 3D world, and every phone in the room becomes a controller.',
    signature: {
      kind: 'split',
      left: { k: 'The TV', v: '3D board, dice, announcer' },
      right: { k: 'The phones', v: 'Moves, bluffs, minigames' },
      link: 'One room code',
    },
  },
  {
    id: 'unearth',
    hook: 'Drop in a spreadsheet and it finds what a busy person misses, with the exact rows to prove each find.',
    signature: {
      kind: 'figures',
      items: [
        { n: '19', label: 'finders' },
        { n: '0', label: 'uploads' },
        { n: '3', label: 'export formats' },
      ],
    },
  },
  {
    id: 'specimen',
    hook: 'A reference shelf for generative art, where every specimen is running code instead of a picture of one.',
    signature: {
      kind: 'figures',
      items: [
        { n: '85', label: 'styles' },
        { n: '12', label: 'families' },
        { n: '0', label: 'images' },
      ],
    },
  },
  {
    id: 'fieldsense',
    hook: 'NFL projections built only on free public data. Every number is a full range of outcomes, so it can price an over/under at any line.',
    signature: { kind: 'chain', label: 'How a projection is made', steps: ['Public data', 'Simulate', 'Range of outcomes'], end: 'Price any line' },
  },
  {
    id: 'oikos',
    hook: 'An economy of AI agents: each one pays rent for its compute and has to earn it back from bounties, or it dies.',
    signature: {
      kind: 'figures',
      items: [
        { n: '5', label: 'smart contracts' },
        { n: '~500', label: 'passing tests' },
        { n: '0', label: 'sign-ups to watch' },
      ],
    },
  },
  {
    id: 'wakerush',
    hook: 'A 20-player arcade boat racer that the server referees, playable on the web or inside Telegram.',
    signature: {
      kind: 'split',
      left: { k: 'On the web', v: 'Full 3D dashboard' },
      right: { k: 'In Telegram', v: 'Mini App, same race' },
      link: 'One server',
    },
  },
  {
    id: 'splash',
    hook: 'Live token feeds, an AI score for the story behind each token, and wallet alerts sent to Telegram as they happen.',
    signature: { kind: 'chain', label: 'How an alert goes out', steps: ['DEX feeds', 'AI narrative score', 'Wallet tracking'], end: 'Telegram alert' },
  },
];
export const STAGE_IDS = STAGE.map((n) => n.id);

// Projects with a recorded demo in public/demos (<id>-laptop.mp4 and <id>-phone.mp4).
// Left out on purpose: Reflect opens on a sign-in screen, and Feast League's 3D board won't load in
// the recorder's software renderer; their screenshots say more.
export const DEMO_IDS = new Set<string>(['hookline', 'unearth', 'specimen', 'fieldsense', 'oikos', 'wakerush', 'splash', 'plato', 'dipper', 'careeva', 'cryptosites', 'wayfound', 'staywestpalm']);

// Sites that allow being shown inside another page (no X-Frame-Options or
// frame-ancestors block), checked by scripts/capture/probe.mjs. The rest open in a new tab.
// checked 2026-10-20; the four that refuse (Hookline, Unearth, Feast League, Splash Signal) open in a new tab
const EMBEDDABLE = new Set<string>(['fieldsense', 'oikos', 'wakerush', 'specimen', 'plato', 'dipper', 'careeva', 'reflect', 'wayfound', 'staywestpalm']);
export const embeds = (projectId: string) => EMBEDDABLE.has(projectId);

// The laptop opens on the standouts (the eight with the best demos); the rest are a tab away.
export const FILTERS = [
  { id: 'best', label: 'Standouts' },
  { id: 'ai', label: 'AI & data' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'web', label: 'Sites & games' },
  { id: 'all', label: 'Everything' },
] as const;
export type FilterId = (typeof FILTERS)[number]['id'];

export const inFilter = (p: Project, f: FilterId) => (f === 'best' ? STAGE_IDS.includes(p.id) : f === 'all' || p.category.includes(f));

/** Live sites a project accounts for (a collection card holds several). */
export const liveSites = (p: Project) => (p.status === 'live' ? (p.collection ? p.collection.length : 1) : 0);

/* ── Units: one per live site, oldest first (the Stack is built from these) ── */

export interface Unit {
  key: string;
  /** what the block says */
  name: string;
  projectId: string;
  launched: string;
  url: string;
  color: string;
  category: string[];
  tags: string[];
}

export const UNITS: Unit[] = PROJECTS.flatMap((p) => {
  if (p.status !== 'live') return [];
  if (p.collection)
    return p.collection.map((s) => ({
      key: s.url,
      name: s.name,
      projectId: p.id,
      launched: s.launched ?? p.launched ?? '2026-01-01',
      url: s.url,
      color: p.color,
      category: p.category,
      tags: p.tags,
    }));
  return p.url
    ? [{ key: p.url, name: p.name, projectId: p.id, launched: p.launched ?? '2026-01-01', url: p.url, color: p.color, category: p.category, tags: p.tags }]
    : [];
}).sort((a, b) => a.launched.localeCompare(b.launched));

/** "2026-03-12" → "Mar 2026" */
export const launchLabel = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
};

/* ── Screenshots (public/work, captured from the live sites) ──────────────── */

// A collection shows its first site on the card.
// the token sites lead with $CASHKITTEN, the one with a live dashboard
const COVER_ID: Record<string, string> = { cryptosites: 'cashkitten' };
export const shotId = (projectId: string) => COVER_ID[projectId] ?? projectId;

// Captured but kept off the page: splash (the site was down, so there's no
// capture), gigaton and pepelien (their art is a real person's likeness).
const NO_SHOT = new Set(['splash', 'gigaton', 'pepelien']);
export const showsShot = (id: string) => !NO_SHOT.has(id);
export const shotSrc = (id: string, variant: 'cover' | 'full' | 'mobile' = 'cover') =>
  `/work/${id}${variant === 'full' ? '-full' : variant === 'mobile' ? '-m' : ''}.webp`;

/* ── The status board: every live URL, in reading order ───────────────────── */

export interface PingTarget {
  key: string; // unique per URL
  name: string;
  url: string;
  host: string;
  projectId: string;
}

/** Where a site runs, in the words a reader would use (the custom domain if it has one). */
export function hostOf(url: string) {
  const h = new URL(url).hostname.replace(/^www\./, '');
  for (const platform of ['railway.app', 'vercel.app', 'web.app']) if (h.endsWith(`.${platform}`) || h.endsWith(`.up.${platform}`)) return platform;
  return h;
}

export const PING_TARGETS: PingTarget[] = [...FLAGSHIPS, ...ALSO_SHIPPED].flatMap((p) => {
  if (p.status !== 'live') return [];
  if (p.collection) {
    return p.collection.map((s) => ({ key: s.url, name: s.name, url: s.url, host: hostOf(s.url), projectId: p.id }));
  }
  return p.url ? [{ key: p.url, name: p.name, url: p.url, host: hostOf(p.url), projectId: p.id }] : [];
});

/* ── Experience ───────────────────────────────────────────────────────────── */

const byStartDesc = (a: Role, b: Role) => b.start.localeCompare(a.start);
export const ROLES = EXPERIENCE.filter((r) => r.kind === 'role').sort(byStartDesc);
export const SIDE_WORK = EXPERIENCE.filter((r) => r.kind === 'side').sort(byStartDesc);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (iso: string | null) => {
  if (!iso) return 'Now';
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
/** Whole months between two ISO months (inclusive of the start month); `null` end = this month. */
export function monthsBetween(start: string, end: string | null, now = new Date()) {
  const [sy, sm] = start.split('-').map(Number);
  const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  return Math.max(1, (ey - sy) * 12 + (em - sm) + 1);
}
export const durationLabel = (months: number) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr` : '', m ? `${m} mo` : ''].filter(Boolean).join(' ');
};

/* ── Tools: lets the Work section filter projects by a tool, from their tags ── */

export interface Tool {
  id: string;
  label: string;
  aliases: string[];
}

// A row lights for a project when any of its tags is one of the row's aliases
// (a Next.js app is a React app; Colyseus is a Node server).
export const TOOLS: Tool[] = [
  { id: 'ts', label: 'TypeScript', aliases: ['TypeScript'] },
  { id: 'react', label: 'React', aliases: ['React', 'React Three Fiber', 'Next.js'] },
  { id: 'next', label: 'Next.js', aliases: ['Next.js'] },
  { id: 'node', label: 'Node.js', aliases: ['Node.js', 'NestJS', 'Colyseus'] },
  { id: 'python', label: 'Python', aliases: ['Python', 'FastAPI'] },
  { id: 'sql', label: 'PostgreSQL', aliases: ['PostgreSQL', 'Prisma'] },
  { id: 'llm', label: 'LLM APIs', aliases: ['AI', 'Multi-LLM', 'GPT-4', 'Claude AI', 'Anthropic SDK'] },
  { id: 'chain', label: 'On-chain', aliases: ['Solidity', 'Foundry', 'On-Chain', 'Solana', 'Web3', 'DeFi APIs'] },
  { id: 'realtime', label: 'WebSockets', aliases: ['WebSocket', 'Colyseus'] },
  { id: 'tailwind', label: 'Tailwind', aliases: ['Tailwind'] },
  { id: 'webgl', label: 'WebGL / Three.js', aliases: ['Three.js', 'React Three Fiber', 'WebGL'] },
  { id: 'motion', label: 'Motion', aliases: ['Framer Motion', 'Motion'] },
  { id: 'stripe', label: 'Stripe', aliases: ['Stripe'] },
];

// The résumé's skills beyond code, shown in the day job (public/Zachary_Bienstock_Resume.pdf, Skills).
export const PRACTICE = [
  {
    title: 'Automation',
    items: ['Getting documents in and filed', 'QuickBooks imports (IIF journals)', "Comparing statements and flagging what's off"],
  },
  {
    title: 'Finance & accounting',
    items: ['Payables, receivables, reconciliation, the monthly close', 'Carrier and agent commission accounting', 'FCC Form 499-Q revenue reporting'],
  },
  {
    title: 'Data & analysis',
    items: ['Advanced Excel and Google Sheets', 'Variance, margin and spend analysis', 'Metabase, Bloomberg Terminal, Figma'],
  },
];

/* ── Off the clock ────────────────────────────────────────────────────────── */

export interface Photo {
  src: string;
  thumb: string;
  w: number;
  h: number;
  label: string;
}
export const PHOTOS = RAW_PHOTOS as Photo[];

/* ── The hero's portrait: the headshot, and the life prints that run behind it ── */

export const PORTRAIT = { src: '/me/headshot.webp', alt: 'Zach Bienstock' };

export interface LifePrint {
  src: string;
  /** the caption on the print */
  label: string;
  /** what's in the photo, for people who can't see it */
  alt: string;
}
// square crops of the Off the clock photos, framed on Zach (or the dog)
export const LIFE_PRINTS: LifePrint[] = [
  { src: '/me/barcelona.webp', label: 'Barcelona', alt: 'Zach on an e-scooter under the palms in Barcelona' },
  { src: '/me/security.webp', label: 'Head of security', alt: "Zach's dog with a blue toy alligator in its mouth" },
  { src: '/me/suited.webp', label: 'Suited up', alt: 'Zach in a navy suit' },
  { src: '/me/pastel.webp', label: 'Last chair', alt: 'Zach and friends on skis under a pastel evening sky' },
  { src: '/me/fog.webp', label: 'Fog day, still riding', alt: 'Zach sitting in fresh snow with his snowboard' },
  { src: '/me/giants.webp', label: 'Giants game', alt: 'Zach and friends outside the stadium at a Giants game in Foxborough' },
];

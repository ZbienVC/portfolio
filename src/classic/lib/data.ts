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

export const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'ai', label: 'AI & data' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'web', label: 'Sites & games' },
] as const;
export type FilterId = (typeof FILTERS)[number]['id'];

export const inFilter = (p: Project, f: FilterId) => f === 'all' || p.category.includes(f);

/** Live sites a project accounts for (a collection card holds several). */
export const liveSites = (p: Project) => (p.status === 'live' ? (p.collection ? p.collection.length : 1) : 0);

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

/* ── Toolkit: which tools each project used, derived from its tags ────────── */

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

export interface MatrixColumn {
  id: string;
  name: string;
  tags: string[];
  self?: boolean;
}

// This page is a column too: it is built with the same tools.
export const MATRIX_COLUMNS: MatrixColumn[] = [
  ...[...FLAGSHIPS, ...ALSO_SHIPPED].map((p) => ({ id: p.id, name: p.name, tags: p.tags })),
  { id: 'this-site', name: 'This site', tags: ['React', 'TypeScript', 'Tailwind', 'Motion', 'WebGL'], self: true },
];

export const uses = (tool: Tool, column: MatrixColumn) => column.tags.some((t) => tool.aliases.includes(t));

export const TOOL_USAGE = TOOLS.map((tool) => ({
  tool,
  columns: MATRIX_COLUMNS.filter((c) => uses(tool, c)).map((c) => c.id),
})).sort((a, b) => b.columns.length - a.columns.length);

// The résumé's skills that aren't a tool in the matrix (public/Zachary_Bienstock_Resume.pdf, Skills).
export const PRACTICE = [
  {
    title: 'AI and LLMs',
    items: ['Claude, GPT and Gemini inside live products', "Agents on the Anthropic SDK's Tool Runner", 'AI coding tools, from spec to launch'],
  },
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

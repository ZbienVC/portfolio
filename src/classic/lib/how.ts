/**
 * How I build: the stack my work sits on, from the frontier models up to what
 * ships. The point of the section is the order of the layers: the labs own the
 * bottom two, I own the third, and each layer runs on everything under it, so a
 * better model lifts the whole stack without a rewrite. Facts come from my own
 * tools (Canopy's never list, the model router, the Feast League session, each
 * project's README).
 */

export interface Fact {
  k: string;
  v: string;
}

export const FACTS: Fact[] = [
  { k: 'by day', v: 'Finance ops at a telecom firm, working like a forward deployed engineer' },
  { k: 'at work', v: 'Python agents, polished deliverables and dozens of internal tools that save hours every week' },
  { k: 'by night', v: '18 live sites, from agent pipelines to party games' },
];

export type LayerId = 'ships' | 'mine' | 'harness' | 'models';

export interface Layer {
  id: LayerId;
  /** 01 to 04, bottom of the stack up */
  no: string;
  /** the small mono line above the name, also the panel's kicker */
  kicker: string;
  name: string;
  /** my layer glows */
  mine?: boolean;
  title: string;
  body: string;
  /** the one phrase in the body worth catching on a skim; it gets underlined as you read */
  em: string;
}

// top of the stack first
export const LAYERS: Layer[] = [
  {
    id: 'ships',
    no: '04',
    kicker: 'what you actually see',
    name: 'What ships',
    title: 'Things with real moving parts',
    body: 'Hookline chains six agents that take a trend from rising to a finished video. FieldSense simulates every NFL game from free public data so it can price any line. Feast League puts a 3D board on the TV and turns every phone in the room into a controller. At work it’s dozens of smaller tools that save my team hours every week.',
    em: 'save my team hours every week',
  },
  {
    id: 'mine',
    no: '03',
    kicker: 'the part that’s mine',
    name: 'My layer',
    mine: true,
    title: 'Taste, written down',
    body: 'When Claude makes the same mistake twice, I turn it into a rule. My design taste lives in a skill and a never list (em dashes are on it), my writing rules follow me into every chat, and memory means I almost never re-explain a project. Five of the connectors Claude uses are servers I wrote.',
    em: 'I turn it into a rule',
  },
  {
    id: 'harness',
    no: '02',
    kicker: 'the labs ship this',
    name: 'The harness',
    title: 'A lot of helpers, one decision maker',
    body: 'I mostly build with Claude. On a big push I run a dozen subagents at once, each one owning its own files, while I play the build and send notes back. The crew on that card is the real one from Feast League. Overnight, Crucible takes a pass at my repos and leaves a briefing for the morning.',
    em: 'while I play the build and send notes back',
  },
  {
    id: 'models',
    no: '01',
    kicker: 'the labs ship this too',
    name: 'Frontier models',
    title: 'The part I don’t try to beat',
    body: 'Opus on high effort for anything that needs judgment, and a routing skill hands the grunt work to cheaper models. When something new comes out I take it for a spin, so I’ve run OpenClaw, Hermes, DeepSeek, Gemini, Codex and Grok along the way. Whatever wins slots in here, and everything above it gets better that day.',
    em: 'everything above it gets better that day',
  },
];

// what each card shows once it faces you
export const SHIPS = [
  { name: 'Hookline', kind: 'agent pipeline' },
  { name: 'FieldSense', kind: 'simulation' },
  { name: 'Feast League', kind: 'real-time multiplayer' },
  { name: 'The day job', kind: 'dozens of internal tools' },
];
export const NEVER_LIST: { key: 'never' | 'always'; rule: string }[] = [
  { key: 'never', rule: 'em dashes, anywhere' },
  { key: 'never', rule: 'overlap or clipping' },
  { key: 'never', rule: 'pills, emoji icons, flat pages' },
  { key: 'always', rule: 'no manual needed' },
];
export const CREW = ['BOARD3D', 'PHONE', 'RULES', 'AUDIO', 'CAMERA', 'QA', 'CRITIC', 'SMOOTH'];
export const ROUTES: [string, string, string?][] = [
  ['judgment, review', 'opus', 'high effort'],
  ['most building', 'sonnet'],
  ['search, bulk edits', 'haiku'],
  ['something new', 'try it', 'keep what wins'],
];

export interface BuiltTool {
  name: string;
  role: string;
  body: string;
  /** a phrase in the body to set in ink */
  em?: string;
}

export const BUILT: BuiltTool[] = [
  {
    name: 'Crucible',
    role: 'my R&D lab',
    body: 'Points research, design and review agents at my repos overnight, builds the best ideas on branches, and leaves me a briefing to judge over coffee. Building it taught me plain Claude keeps catching up, so I’m trimming it down to a few sharp specialists, like one that clicks every button in an app and reports what broke.',
    em: 'clicks every button in an app',
  },
  {
    name: 'Nightshift',
    role: 'night watch',
    body: 'Watches my GitHub, Railway and Vercel while I sleep and leaves a short note in the morning. It runs on my own Claude plan, so there are no surprise API bills.',
  },
  {
    name: 'Switchyard',
    role: 'the map',
    body: 'A live map of every repo and skill I have, so I reuse before I rebuild. Its Canopy view grades each skill so the right one fires on its own.',
  },
];

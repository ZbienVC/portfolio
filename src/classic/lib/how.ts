/**
 * How I build: the stack my work sits on, from the frontier models up to what
 * ships. The point of the section is the order of the layers: the labs own the
 * bottom two, I own the third, and every model release makes everything above
 * it better without a rewrite. Facts come from my own tools (Canopy's never
 * list, the model router, the Feast League session, each project's README).
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
  /** the small mono line above the name, also the panel's kicker */
  kicker: string;
  name: string;
  /** short tags that read in the stack, before a card is opened */
  chips: string[];
  /** my layer glows */
  mine?: boolean;
  title: string;
  body: string;
}

// top of the stack first
export const LAYERS: Layer[] = [
  {
    id: 'ships',
    kicker: 'Layer 4 · the point of all this',
    name: 'What ships',
    chips: ['18 live sites', 'dozens of work tools'],
    title: 'Builds with real thinking behind them',
    body: 'Hookline chains six agents to turn a rising trend into a finished video. FieldSense simulates every NFL game from free public data to price any line. Feast League runs a 3D board on the TV with every phone in the room as a controller. At work it is dozens of smaller tools that save my team hours and still look good doing it.',
  },
  {
    id: 'mine',
    kicker: 'Layer 3 · mine',
    name: 'My layer',
    chips: ['skills', 'memory', 'connectors', 'never list'],
    mine: true,
    title: 'Taste, written down',
    body: 'When Claude makes the same mistake twice, it becomes a rule. My design taste lives in a skill and a never list, my writing rules follow me everywhere, and memory means I almost never re-explain a project. Five of the connectors Claude uses are servers I wrote.',
  },
  {
    id: 'harness',
    kicker: 'Layer 2 · the harness',
    name: 'The harness',
    chips: ['Claude', 'subagents', 'Crucible overnight'],
    title: 'A lot of helpers, one decision maker',
    body: 'I mostly build with Claude. On a big push I run a dozen subagents at once, each owning its own files, while I play the build and send notes back. That card is the actual crew from Feast League. Overnight, Crucible takes a pass at my repos so a briefing is waiting when I wake up.',
  },
  {
    id: 'models',
    kicker: 'Layer 1 · the frontier',
    name: 'Frontier models',
    chips: ['Opus', 'Sonnet', 'Haiku', 'whatever is new'],
    title: 'The part I don’t try to beat',
    body: 'Opus on high effort for anything that needs judgment, with a routing skill sending the grunt work to cheaper models. When something new sparks my interest I take it for a spin, so I have run OpenClaw, Hermes, DeepSeek, Gemini, Codex and Grok along the way. Whatever wins slots in here, and every layer above gets better that day.',
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
    body: 'Points research, design and review agents at my repos overnight, builds the best ideas on branches, and leaves me a briefing to judge over coffee. Building it taught me plain Claude keeps catching up, so I’m trimming it to a few sharp specialists, like one that clicks every button in an app and reports what broke.',
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

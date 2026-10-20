/**
 * How I build: the AI tools behind the work. Every number here comes from the
 * tools' own records (Crucible's crew roster and report cards, Canopy's skill
 * map, each repo's README), read on 2026-10-20. Update them from the same places.
 */

export interface RunStep {
  title: string;
  body: string;
  /** a step that's mine, not the crew's */
  you?: boolean;
}

export const RUN_STEPS: RunStep[] = [
  { title: 'A goal', body: 'I write one sentence, like “make the quotes easier to trust.”', you: true },
  { title: 'Research', body: 'Agents read the code and the web, so every idea has proof behind it.' },
  { title: 'Debate', body: 'A strategist pitches ideas, a critic pokes holes, and a ranker picks the best.' },
  { title: 'Build', body: 'The winner gets built on its own branch, and the project’s tests run.' },
  { title: 'Review', body: 'Code, security, product and design reviewers, plus one that sees only the change.' },
  { title: 'My yes', body: 'I read a ten-second card, then ship it or send it back.', you: true },
];

export interface System {
  id: string;
  name: string;
  /** a few words under the tab */
  role: string;
  /** where it runs, as a mono label */
  runsOn: string;
  what: string;
  figures: { n: string; label: string }[];
  detail: { kind: 'chips'; label: string; items: { name: string; note?: string }[] } | { kind: 'rules'; items: { name: string; body: string }[] };
  /** the plain truth about how well it works, where there's one worth telling */
  honest?: string;
}

export const SYSTEMS: System[] = [
  {
    id: 'crucible',
    name: 'Crucible',
    role: 'An R&D crew for my codebases',
    runsOn: 'Railway · Claude Code',
    what: 'I connect a codebase and say what I want. The crew reads the code, researches, proposes ideas, argues about them, builds the best ones on separate branches, runs the tests and writes me a short briefing. Every night its Chief of Staff plans up to three runs from my goals and the budget left.',
    figures: [
      { n: '72', label: 'specialist agents' },
      { n: '16', label: 'teams, each for one kind of job' },
      { n: '868', label: 'ideas compared two at a time' },
      { n: '561', label: 'code reviews written' },
    ],
    detail: {
      kind: 'chips',
      label: 'Some of the teams',
      items: [
        { name: 'Research', note: '5' },
        { name: 'Ideas', note: '4' },
        { name: 'Design', note: '12' },
        { name: 'Build', note: '5' },
        { name: 'Review', note: '5' },
        { name: 'Outsiders who never see the code', note: '6' },
        { name: 'Is it worth building', note: '5' },
        { name: 'Planning', note: '7' },
      ],
    },
    honest:
      'Every agent gets a report card from the others. The Engineer’s grade is 56 out of 100, and I shipped 28 of the 50 builds it handed me. That’s why the review team and the outsiders exist, and why the merge button stays mine.',
  },
  {
    id: 'nightshift',
    name: 'Nightshift',
    role: 'Overnight jobs and watch duty',
    runsOn: 'My computer or Railway · no paid AI',
    what: 'It runs repetitive jobs while I’m away and keeps watch over my projects on GitHub, Railway, Vercel, Cloudflare and Azure. In the morning it says what it handled, what it found, and the few things that need me. It never calls a paid AI.',
    figures: [
      { n: '8', label: 'agents in its command center' },
      { n: '5', label: 'platforms it watches' },
      { n: '3', label: 'trust levels per job' },
      { n: '0', label: 'paid AI calls' },
    ],
    detail: {
      kind: 'rules',
      items: [
        { name: 'Watch only', body: 'Reports what it sees and changes nothing.' },
        { name: 'Ask first', body: 'Prepares every change and waits for me.' },
        { name: 'On its own', body: 'Handles the routine work; anything marked mine still asks.' },
      ],
    },
  },
  {
    id: 'switchyard',
    name: 'Switchyard',
    role: 'A map of everything I’ve built',
    runsOn: 'Railway · Postgres',
    what: 'A live blueprint of every project in my GitHub: what each one needs, what it offers, and which connections are worth building next, each scored from 0 to 100. Its Canopy view maps every Claude skill I can use and grades how well each one is written, so the right one gets picked.',
    figures: [
      { n: '375', label: 'skills on the map' },
      { n: '14', label: 'of them written by me' },
      { n: '5', label: 'parts in every connection score' },
      { n: '0–100', label: 'how worth building it is' },
    ],
    detail: {
      kind: 'chips',
      label: 'What a connection’s score weighs',
      items: [
        { name: 'Need', note: '25%' },
        { name: 'Readiness', note: '25%' },
        { name: 'Momentum', note: '20%' },
        { name: 'Fit', note: '15%' },
        { name: 'Leverage', note: '15%' },
      ],
    },
  },
  {
    id: 'atelier',
    name: 'Atelier',
    role: 'My design engine',
    runsOn: 'A Claude Code skill',
    what: 'A design skill I wrote so every project gets its own look instead of a template. It starts from a finished baseline and retunes it, with a menu of reusable parts and a list of tells that make a page look machine-made. Four of its parts are on this page.',
    figures: [
      { n: '196', label: 'reusable parts' },
      { n: '3', label: 'looks it offers per brief' },
      { n: '4', label: 'of its parts on this page' },
      { n: '3', label: 'skills it installs' },
    ],
    detail: {
      kind: 'chips',
      label: 'The parts on this page',
      items: [
        { name: 'Shader gradient', note: 'the hero' },
        { name: 'Split-flap', note: 'the status board' },
        { name: 'Line draw', note: 'Experience' },
        { name: 'Hand notes', note: 'Show the work' },
      ],
    },
  },
  {
    id: 'skills',
    name: 'Skills and routing',
    role: 'Same results, fewer tokens',
    runsOn: 'Claude Code · claude.ai',
    what: 'My own skills and helper agents, built for one goal: the same or better results while spending less. The model router sends each piece of work to the cheapest model and effort level that keeps top quality. Four helpers are each locked to one model, from a fast code searcher to a reviewer that never edits.',
    figures: [
      { n: '4', label: 'helper agents' },
      { n: '4', label: 'models it routes between' },
      { n: '94', label: 'router’s Canopy score' },
      { n: '98', label: 'handoff skill’s score' },
    ],
    detail: {
      kind: 'chips',
      label: 'The helpers and their models',
      items: [
        { name: 'Explore', note: 'Haiku' },
        { name: 'Bulk editor', note: 'Haiku' },
        { name: 'Builder', note: 'Sonnet' },
        { name: 'Reviewer', note: 'Opus' },
      ],
    },
  },
];

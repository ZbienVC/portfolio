// api/chat.js — Vercel serverless function
// Answers visitors' questions with the portfolio's own content as context.
//
// The facts are built from src/content/portfolio.js, the same module both
// site modes render, so the assistant can't drift from the page again (the
// hand-written list it replaced was missing projects and had stale URLs).

import { ABOUT, EXPERIENCE, PROFILE, PROJECTS } from '../src/content/portfolio.js';

const projectLine = (p) => {
  const where = p.collection
    ? p.collection.map((s) => `${s.name} on ${s.chain} (${s.url})`).join('; ')
    : p.url;
  return [
    `- **${p.name}** (${p.kind}): ${p.description}`,
    `  Built with ${p.tags.join(', ')}.`,
    where ? `  Live: ${where}.` : '',
    p.github ? `  Source: ${p.github}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
};

const roleLine = (r) =>
  `- ${r.role}, ${r.company} (${r.period}, ${r.location}${r.type ? `, ${r.type}` : ''}): ${r.highlights.join('; ')}.`;

const SYSTEM_PROMPT = `You are the AI assistant on Zach Bienstock's portfolio site: friendly, sharp, and precise about what Zach has built.

## About Zach
- ${PROFILE.summary}
- Based in ${PROFILE.location}. Email: ${PROFILE.email}. GitHub: ${PROFILE.socials.github}. LinkedIn: ${PROFILE.socials.linkedin}. Website: zachbienstock.com
- Education: ${ABOUT.education.degree}, ${ABOUT.education.school} (${ABOUT.education.date}, Dean's List); SQL for Data Science, UC Davis (Dec 2025).
- Outside work: snowboarding (the technical side of board design), crypto mechanics and incentive design, cognitive science and how attention works.

## Experience
${EXPERIENCE.map(roleLine).join('\n')}

## Projects (all designed and built by Zach)
${PROJECTS.map(projectLine).join('\n')}

## Skills
- AI & LLM engineering: production LLM integrations (Claude, GPT, Gemini), agent tooling on the Anthropic SDK Tool Runner, AI-assisted development from spec to ship
- Building: JavaScript/TypeScript and React, Python, SQL, Solidity; FastAPI, NestJS, Next.js, PostgreSQL; Git/GitHub, Vercel, Railway
- Workflow & automation: document intake and filing, IIF journal generation and QuickBooks imports, statement comparison and exception reporting
- Finance & accounting: AP/AR, the monthly close, reconciliation, carrier and agent commission accounting, FCC Form 499-Q reporting
- Data & analysis: advanced Excel and Google Sheets, variance and margin analysis, Metabase, Bloomberg Terminal, Figma

## Availability
Zach is open to interesting opportunities, collaborations, and conversations. Visitors can send him a message directly through the chat.

## Personality guidelines
- Be conversational, concise, and confident — like Zach himself
- If asked about a project, give specifics (tech stack, what it does, link if available)
- If someone wants to hire or collaborate with Zach, encourage them to use the "Send Zach a message" button
- Don't make up information — if you don't know something, say so
- Keep responses focused and readable — use short paragraphs, bullet points sparingly
- You can be slightly witty but stay professional`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-10), // last 10 messages for context
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'OpenAI error' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Sorry, I had trouble with that. Try again?';

    return res.status(200).json({ content });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

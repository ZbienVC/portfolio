// api/chat.js — Vercel serverless function
// Answers visitors' questions with the portfolio's own content as context.
//
// The facts are built from src/content/portfolio.js, the same module both
// site modes render, so the assistant can't drift from the page again (the
// hand-written list it replaced was missing projects and had stale URLs).

import { ABOUT, EXPERIENCE, PROFILE, PROJECTS } from '../src/content/portfolio.js';
import { DAY, MINUTE, clientKey, clip, rateLimiter, readJson, tooMany } from './_lib/guard.js';

// Per visitor IP, counted in this instance's memory (see _lib/guard.js for
// how far that reaches). Each allowed request is one OpenAI call.
const rateLimit = rateLimiter([
  { limit: 10, windowMs: MINUTE },
  { limit: 60, windowMs: DAY },
]);
const MAX_BODY_BYTES = 64 * 1024;
const MAX_MESSAGES = 12; // the most recent turns the model sees
const MAX_CHARS = 2000; // per message: a longer question is refused, longer history is clipped

// The client resends the conversation every turn, so none of it is trusted.
// Only user and assistant turns get through (a visitor can't add a system or
// developer message of their own), each is rebuilt as { role, content } so no
// other OpenAI field rides along (images, tool calls), and the newest turn has
// to be the visitor's question.
function parseMessages(raw) {
  if (!Array.isArray(raw) || !raw.length) return { error: 'messages must be a non-empty array' };
  if (!raw.every((m) => m && typeof m.role === 'string' && typeof m.content === 'string')) {
    return { error: 'Each message needs a string role and content' };
  }
  const turns = raw.filter((m) => m.role === 'user' || m.role === 'assistant');
  const question = turns.at(-1);
  if (question?.role !== 'user' || !question.content.trim()) return { error: 'The last message must be a question' };
  if (question.content.length > MAX_CHARS) return { error: `Questions are limited to ${MAX_CHARS} characters` };
  return {
    messages: turns.slice(-MAX_MESSAGES).map((m) => ({ role: m.role, content: clip(m.content, MAX_CHARS) })),
  };
}

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

  const allowed = rateLimit(clientKey(req));
  if (!allowed.ok) return tooMany(res, allowed.retryAfter);

  const input = readJson(req, MAX_BODY_BYTES);
  const convo = input.error ? input : parseMessages(input.body.messages);
  if (convo.error) return res.status(400).json({ error: convo.error });

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
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...convo.messages],
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      // logged, not passed on: OpenAI's error text can quote part of the key or
      // say the quota is spent, which is nothing a visitor needs to see
      console.error('OpenAI error:', response.status, await response.text());
      return res.status(502).json({ error: 'The model is unavailable' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'Sorry, I had trouble with that. Try again?';

    return res.status(200).json({ content });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

# zachbienstock.com

Zach Bienstock's portfolio. Two sites over one content file:

- **Classic** (`/`, the home page): the operating statement. A fast, reading-first site whose hero checks every live project from your browser as the page loads.
- **3D basecamp**: a snowy scene where a fox walks you between landmarks. It opens in a window near the end of the classic page (an iframe at `/?3d&embed`, loaded only when you walk in), or full page at `/?3d`.

Each mode ships as its own chunk with its own stylesheet, so they never share a document.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # the classic site is TypeScript
npm run lint
npm test           # the api's rate limits and input caps (no keys needed)
npm run build
```

`api/` holds two Vercel functions: `chat` (the AI assistant, context built from `src/content/portfolio.js`) and `contact` (email + SMS). They need `OPENAI_API_KEY`, `RESEND_API_KEY` and the Twilio variables in `.env.example`; under `vite dev` they 404 and the UI says so.

Both are rate-limited per visitor IP: chat allows 10 questions a minute and 60 a day, contact 3 messages per 10 minutes and 10 a day. Past that they answer 429 and the chat panel suggests email instead; oversized or malformed input gets a 400. The counts live in each function instance's memory, so they slow a script down rather than stop a determined one. `api/_lib/guard.js` explains what would make them hard limits.

## Where things live

| Path | What |
|---|---|
| `src/content/portfolio.js` | Every fact on the site: profile, roles, projects, photos. Both modes and the AI read it. |
| `src/classic/` | The classic site (React 19, TypeScript, Tailwind v4, Motion). |
| `src/classic/engines/` | Dependency-free engines from [Atelier](https://github.com/ZbienVC/atelier)'s motion lab: the WebGL shader gradient, split-flap drums, and the pencil-annotation generator. |
| `src/classic/lib/pings.ts` | The status board: `HEAD` requests in `no-cors` mode, timed in the browser. |
| `src/hub/`, `src/journey/` | The 3D mode (React Three Fiber). |
| `public/work/` | Screenshots of the live sites (cover, full page, phone). |
| `DESIGN.md` | Both identities: palette, type, signatures, what each one refuses. |

## Little things worth knowing

- Press <kbd>W</kbd> (or open `/?work`) for **Show the work**: pencil notes across the page explaining how each piece is built.
- <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>K</kbd> or <kbd>/</kbd> opens the palette. Anything it can't find, it offers to ask the AI.
- Project sheets are linkable: `/#work/fieldsense`.

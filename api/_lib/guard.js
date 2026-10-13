// api/_lib/guard.js — abuse guards shared by the API functions. Vercel doesn't
// turn files under an underscore folder in api/ into endpoints, so this is
// only a module that chat.js and contact.js import.
//
// The rate limit is best-effort, and this is its limit: counts live in the
// memory of one function instance. Vercel runs a function on more than one
// instance (one or more per region, more under load) and retires idle ones, so
// a visitor who lands on a fresh instance starts a fresh count. That stops a
// script hammering the site from one address; it doesn't stop an attacker with
// many addresses. For a count every instance shares, add a WAF rate-limit rule
// on /api/chat (Vercel dashboard → Firewall; Hobby includes one rule, with
// windows up to 10 minutes) or keep the counts in a shared store.

export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

/**
 * A sliding-window limiter over any number of windows, e.g.
 * [{ limit: 10, windowMs: MINUTE }, { limit: 60, windowMs: DAY }].
 * `take(key)` records a request and returns { ok: true }, or, when a window is
 * full, { ok: false, retryAfter } in whole seconds. Refused requests aren't
 * recorded, so retrying while blocked doesn't push the block further out.
 */
export function rateLimiter(rules, { maxKeys = 5000 } = {}) {
  const span = Math.max(...rules.map((r) => r.windowMs));
  // key → times of its allowed requests, oldest first. Map order doubles as
  // recency: a key is re-inserted on every request, so the first is the stalest.
  const log = new Map();

  return function take(key, now = Date.now()) {
    const times = (log.get(key) ?? []).filter((t) => t > now - span);
    let wait = 0;
    for (const { limit, windowMs } of rules) {
      const recent = times.filter((t) => t > now - windowMs);
      // a slot frees up when the limit-th most recent request leaves the window
      if (recent.length >= limit) wait = Math.max(wait, recent[recent.length - limit] + windowMs - now);
    }
    if (!wait) times.push(now);
    log.delete(key);
    log.set(key, times);
    // forget keys that have gone quiet, and the stalest ones past the cap
    for (const [k, t] of log) {
      if (log.size <= maxKeys && t.at(-1) > now - span) break;
      log.delete(k);
    }
    return wait ? { ok: false, retryAfter: Math.ceil(wait / 1000) } : { ok: true };
  };
}

/**
 * The visitor's address, as a rate-limit key. On Vercel, x-real-ip and
 * x-forwarded-for are written by the platform, so a client can't spoof them.
 * An IPv6 visitor usually holds a whole /64 and can hop between its addresses,
 * so for IPv6 the key is that prefix.
 */
export function clientKey(req) {
  const h = req.headers ?? {};
  const raw = h['x-real-ip'] || h['x-forwarded-for'] || req.socket?.remoteAddress || '';
  let ip = String(raw).split(',')[0].trim().toLowerCase().slice(0, 64);
  if (ip.startsWith('::ffff:') && ip.includes('.')) ip = ip.slice(7); // IPv4 written as IPv6
  if (!ip.includes(':')) return ip || 'unknown';
  const [head, tail] = ip.split('%')[0].split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups =
    tail === undefined ? left : [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

/** Answers 429 with a Retry-After the client can use to pick its wording. */
export function tooMany(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter));
  return res.status(429).json({ error: 'Too many requests', retryAfter });
}

/**
 * The request's JSON object body as { body }, or { error } (for a 400) when
 * it's malformed, isn't an object, or is over maxBytes.
 */
export function readJson(req, maxBytes) {
  if (Number(req.headers['content-length']) > maxBytes) return { error: 'Request too large' };
  let body;
  try {
    body = req.body; // Vercel parses the body on first read and throws on malformed JSON
  } catch {
    return { error: 'Invalid JSON' };
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.isBuffer(body)) {
    return { error: 'Expected a JSON object' };
  }
  // a chunked upload has no content-length, so measure what arrived
  if (Buffer.byteLength(JSON.stringify(body)) > maxBytes) return { error: 'Request too large' };
  return { body };
}

/** Cuts text to n UTF-16 units without splitting an emoji's surrogate pair. */
export const clip = (s, n) => (s.length <= n ? s : s.slice(0, /[\uD800-\uDBFF]/.test(s[n - 1]) ? n - 1 : n));

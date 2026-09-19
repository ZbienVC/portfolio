// api/contact.js — sends email via Resend + SMS via Twilio

import { DAY, MINUTE, clientKey, clip, rateLimiter, readJson, tooMany } from './_lib/guard.js';

// Per visitor IP, counted in this instance's memory (see _lib/guard.js for
// how far that reaches). Every message costs an email and a text, and the
// email provider has a daily quota, so the allowance is small.
const rateLimit = rateLimiter([
  { limit: 3, windowMs: 10 * MINUTE },
  { limit: 10, windowMs: DAY },
]);
const MAX_BODY_BYTES = 96 * 1024; // the message plus the chat transcript that comes along
const MAX = { name: 100, email: 254, message: 5000 };
const MAX_TRANSCRIPT = 12; // the most recent chat turns quoted in the email
const MAX_TURN_CHARS = 2000;

// Visitor text lands in an HTML email, so it's escaped first: a message can't
// inject markup, links or tracking pixels into the inbox.
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// name and email end up in a subject line and a text message, so each is one line
const oneLine = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = rateLimit(clientKey(req));
  if (!allowed.ok) return tooMany(res, allowed.retryAfter);

  const input = readJson(req, MAX_BODY_BYTES);
  if (input.error) return res.status(400).json({ error: input.error });

  const name = oneLine(input.body.name);
  const email = oneLine(input.body.email);
  const message = typeof input.body.message === 'string' ? input.body.message.trim() : '';

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return res.status(400).json({ error: `Name, email or message is too long (messages are limited to ${MAX.message} characters)` });
  }

  // the chat that led here, if any: its last few turns, each clipped
  const { conversation } = input.body;
  const transcript = (Array.isArray(conversation) ? conversation : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TRANSCRIPT);

  const resendKey = process.env.RESEND_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const twilioTo = process.env.TWILIO_TO_NUMBER; // your cell

  const errors = [];

  // ── Email via Resend ─────────────────────────────────────
  if (resendKey) {
    try {
      const conversationHtml = transcript.length
        ? `<hr/><h3>Chat Context</h3><div style="background:#f5f5f5;padding:12px;border-radius:6px;font-family:monospace;font-size:13px">${
            transcript.map(m =>
              `<p><strong>${m.role === 'user' ? '👤 Visitor' : '🤖 Assistant'}:</strong> ${esc(clip(m.content, MAX_TURN_CHARS))}</p>`
            ).join('')
          }</div>`
        : '';

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Contact <onboarding@resend.dev>',
          to: 'zbienstock@gmail.com',
          subject: `New message from ${clip(name, 80)} — zachbienstock.com`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#10d9a0">New Portfolio Contact</h2>
              <p><strong>Name:</strong> ${esc(name)}</p>
              <p><strong>Email:</strong> ${email ? esc(email) : 'Not provided'}</p>
              <hr/>
              <h3>Message</h3>
              <p style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #10d9a0">${esc(message)}</p>
              ${conversationHtml}
              <hr/>
              <p style="color:#999;font-size:12px">Sent from zachbienstock.com portfolio chat</p>
            </div>
          `,
        }),
      });
    } catch (e) {
      errors.push('Email failed: ' + e.message);
    }
  }

  // ── SMS via Twilio ───────────────────────────────────────
  if (twilioSid && twilioToken && twilioFrom && twilioTo) {
    try {
      const smsBody = `📬 New portfolio message from ${name}${email ? ` (${email})` : ''}:\n\n"${message.slice(0, 140)}${message.length > 140 ? '...' : ''}"`;

      const twilioRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioFrom,
            To: twilioTo,
            Body: smsBody,
          }).toString(),
        }
      );

      if (!twilioRes.ok) {
        const e = await twilioRes.json();
        errors.push('SMS failed: ' + (e.message || 'Unknown error'));
      }
    } catch (e) {
      errors.push('SMS failed: ' + e.message);
    }
  }

  if (errors.length > 0) {
    console.error('Contact errors:', errors);
  }

  // Always return success to user even if notifications had issues
  return res.status(200).json({ success: true });
}

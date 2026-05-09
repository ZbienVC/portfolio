// api/contact.js — sends email via Resend + SMS via Twilio

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message, conversation } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;
  const twilioTo = process.env.TWILIO_TO_NUMBER; // your cell

  const errors = [];

  // ── Email via Resend ─────────────────────────────────────
  if (resendKey) {
    try {
      const conversationHtml = conversation?.length
        ? `<hr/><h3>Chat Context</h3><div style="background:#f5f5f5;padding:12px;border-radius:6px;font-family:monospace;font-size:13px">${
            conversation.map(m =>
              `<p><strong>${m.role === 'user' ? '👤 Visitor' : '🤖 Assistant'}:</strong> ${m.content}</p>`
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
          subject: `New message from ${name} — zachbienstock.com`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#10d9a0">New Portfolio Contact</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email || 'Not provided'}</p>
              <hr/>
              <h3>Message</h3>
              <p style="background:#f9f9f9;padding:16px;border-radius:8px;border-left:4px solid #10d9a0">${message}</p>
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

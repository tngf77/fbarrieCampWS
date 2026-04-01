/**
 * Netlify Function: /api/signup
 *
 * Receives form submissions, then:
 *   1. Sends a notification email to the campaign inbox via Resend
 *   2. Appends the row to Google Sheets via a Google Apps Script webhook
 *
 * Required environment variables (set in Netlify → Site Settings → Env Vars):
 *   RESEND_API_KEY          — from resend.com (free tier: 3 000 emails/month)
 *   RESEND_FROM_EMAIL       — verified sender, e.g. noreply@fatmatabarrie.com
 *                             (use "onboarding@resend.dev" while testing)
 *   GOOGLE_SHEETS_WEBHOOK_URL — the /exec URL of your published Apps Script
 */

const CAMPAIGN_EMAIL = 'info@fatmatabarrie.com';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Accept both JSON (fetch) and form-urlencoded (native POST)
  let data;
  try {
    const ct = (event.headers['content-type'] || '').toLowerCase();
    data = ct.includes('application/json')
      ? JSON.parse(event.body)
      : Object.fromEntries(new URLSearchParams(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request body' }) };
  }

  const { first_name, last_name, email, zip } = data;
  if (!first_name || !last_name || !email || !zip) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  const tasks = [];

  /* ── 1. Email notification via Resend ─────────────────────────────── */
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    tasks.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Barrie for MoCo <${fromEmail}>`,
          to: [CAMPAIGN_EMAIL],
          reply_to: email,
          subject: `New Signup: ${first_name} ${last_name} — ${zip}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: sans-serif; color: #1a1a2e; background: #f9f6f2; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 8px; border-left: 4px solid #c41230;
            max-width: 480px; margin: 0 auto; padding: 28px 32px; }
    h2 { color: #c41230; margin-top: 0; font-size: 1.2rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    td { padding: 8px 6px; font-size: 0.95rem; vertical-align: top; }
    td:first-child { font-weight: 700; color: #555; width: 110px; }
    .footer { font-size: 0.75rem; color: #999; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>New Team Barrie Signup</h2>
    <table>
      <tr><td>Name</td><td>${first_name} ${last_name}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td>Zip Code</td><td>${zip}</td></tr>
      <tr><td>Received</td><td>${timestamp} ET</td></tr>
    </table>
    <p class="footer">Submitted via fatmatabarrie.com · Barrie for Montgomery County</p>
  </div>
</body>
</html>`,
        }),
      }).catch((err) => console.error('Resend error:', err))
    );
  } else {
    console.warn('RESEND_API_KEY not set — skipping email');
  }

  /* ── 2. Google Sheets via Apps Script webhook ─────────────────────── */
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (sheetsUrl) {
    tasks.push(
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, email, zip, timestamp }),
      }).catch((err) => console.error('Sheets webhook error:', err))
    );
  } else {
    console.warn('GOOGLE_SHEETS_WEBHOOK_URL not set — skipping Sheets');
  }

  await Promise.allSettled(tasks);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};

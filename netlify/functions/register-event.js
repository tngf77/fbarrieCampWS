import { Resend } from 'resend';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let firstName, lastName, email, phone;
  try {
    ({ firstName, lastName, email, phone } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!firstName || !lastName || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'Fatmata Barrie Campaign <events@fatmatabarrie.com>',
      to: email,
      subject: "You're registered! Meet & Greet with Fatmata Barrie — June 3",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Georgia, serif; color: #222; max-width: 580px; margin: 0 auto; padding: 24px;">

          <div style="text-align: center; margin-bottom: 28px;">
            <img src="https://fatmatabarrie.com/images/logo.png" alt="Fatmata Barrie for Montgomery County Council" style="height: 52px; width: auto;" />
          </div>

          <h1 style="color: #0832A0; font-size: 1.5rem; margin-bottom: 6px;">You're registered!</h1>
          <p style="font-size: 1.05rem; color: #444; margin-top: 0;">Hi ${firstName}, we can't wait to see you.</p>

          <div style="background: #f5f7ff; border-left: 4px solid #0832A0; border-radius: 4px; padding: 20px 24px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: #0832A0; font-weight: bold;">Event Details</p>
            <p style="margin: 0 0 6px; font-size: 1rem;"><strong>Meet &amp; Greet with Fatmata Barrie</strong></p>
            <p style="margin: 0 0 6px; font-size: 1rem;">Tuesday, June 3, 2026 &nbsp;·&nbsp; 5:30 PM – 7:00 PM</p>
            <p style="margin: 0; font-size: 1rem;">20908 Severndale Terrace, Germantown, MD 20876</p>
          </div>

          <p style="font-size: 0.95rem; color: #444; line-height: 1.7;">
            This is an intimate gathering — a chance to meet Fatmata, ask questions, and hear directly about her vision for Montgomery County. We look forward to seeing you there.
          </p>

          <div style="text-align: center; background: #fff3f3; border-radius: 6px; padding: 20px 24px; margin: 28px 0; border: 1px solid #f5c0c0;">
            <p style="margin: 0 0 12px; font-size: 1rem; color: #222;"><strong>Help Fatmata win in November.</strong></p>
            <p style="margin: 0 0 16px; font-size: 0.9rem; color: #555;">A donation of any size makes a real difference for this campaign.</p>
            <a href="https://donorbox.org/fatmata-barrie-four-montgomery-county-disability"
               style="display: inline-block; background: #E41C23; color: white; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; letter-spacing: 0.05em; text-transform: uppercase;">
              Donate Now
            </a>
          </div>

          <p style="font-size: 0.85rem; color: #888; text-align: center; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
            Paid for by Fatmata Barrie for Montgomery County Council<br>
            Questions? Reply to this email or visit <a href="https://fatmatabarrie.com" style="color: #0832A0;">fatmatabarrie.com</a>
          </p>

        </body>
        </html>
      `,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error('Resend error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send confirmation email' }),
    };
  }
};

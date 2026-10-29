const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function emailHtml({ preheader, eyebrow, title, intro, content = "", actionUrl, actionLabel, footer = "One focused day at a time. Keep going. ✳" }) {
  const action = actionUrl && actionLabel
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px"><tr><td bgcolor="#8A2E52" style="border-radius:8px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:13px 20px;border:1px solid #8A2E52;border-radius:8px;color:#ffffff;font:600 15px/1.2 Courier New,Courier,monospace;text-decoration:none">${escapeHtml(actionLabel)} &nbsp;→</a></td></tr></table>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)} · DevSprint</title></head><body style="margin:0;padding:0;background:#FBF9FA;color:#1A1417;font-family:Courier New,Courier,monospace"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader || title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FBF9FA"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;border:1px solid #E7E0E4;border-radius:16px;background:#ffffff"><tr><td style="padding:30px 34px 28px"><p style="margin:0 0 26px;color:#8A2E52;font:700 12px/1.4 Courier New,Courier,monospace;letter-spacing:1.5px">DEVSPRINT <span style="color:#A89AA0;font-weight:400">· BUILD YOUR NEXT CHAPTER</span></p><p style="margin:0 0 10px;color:#8A2E52;font:700 11px/1.4 Courier New,Courier,monospace;letter-spacing:1.3px;text-transform:uppercase">${escapeHtml(eyebrow || "60-DAY DEVELOPER SPRINT")}</p><h1 style="margin:0;color:#1A1417;font:700 32px/1.12 Courier New,Courier,monospace;letter-spacing:-.5px">${escapeHtml(title)}</h1>${intro ? `<p style="margin:14px 0 0;color:#7A6E74;font:16px/1.65 Courier New,Courier,monospace">${escapeHtml(intro)}</p>` : ""}${content}${action}<p style="margin:26px 0 0;padding-top:17px;border-top:1px solid #E7E0E4;color:#7A6E74;font:12px/1.6 Courier New,Courier,monospace">${footer}</p></td></tr></table><p style="margin:14px 0 0;color:#A2939A;font:11px/1.5 Courier New,Courier,monospace">C# Core · .NET Core · JavaScript · React</p></td></tr></table></body></html>`;
}

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL);
}

async function send({ to, subject, html }) {
  if (!isConfigured()) throw new Error("Email delivery is not configured.");
  if (!to || !subject || !html) throw new Error("A recipient, subject, and HTML body are required.");

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html })
  });
  if (!response.ok) throw new Error("Email delivery failed.");
  return response.json().catch(() => ({}));
}

export const emailService = Object.freeze({
  send,
  render: emailHtml,
  escapeHtml,
  isConfigured
});

export default emailService;

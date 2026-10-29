export async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Reminder storage is not configured.");

  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(command)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) throw new Error("Reminder storage request failed.");
  return payload.result;
}

export function siteUrl() {
  const raw = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!raw) throw new Error("SITE_URL is not configured.");
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") throw new Error("SITE_URL must use HTTPS.");
  return parsed.origin;
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Email delivery is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  if (!response.ok) throw new Error("Email delivery failed.");
  return response.json().catch(() => ({}));
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export function emailHtml({ preheader, eyebrow, title, intro, content = "", actionUrl, actionLabel, footer = "One focused day at a time. Keep going. ✳" }) {
  const action = actionUrl && actionLabel
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px"><tr><td bgcolor="#8A2E52" style="border-radius:8px"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:13px 20px;border:1px solid #8A2E52;border-radius:8px;color:#ffffff;font:600 15px/1.2 Arial,sans-serif;text-decoration:none">${escapeHtml(actionLabel)} &nbsp;→</a></td></tr></table>`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)} · DevSprint</title></head><body style="margin:0;padding:0;background:#FBF9FA;color:#1A1417;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader || title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FBF9FA"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;border:1px solid #E7E0E4;border-radius:16px;background:#ffffff"><tr><td style="padding:30px 34px 28px"><p style="margin:0 0 26px;color:#8A2E52;font:700 12px/1.4 Arial,sans-serif;letter-spacing:1.5px">DEVSPRINT <span style="color:#A89AA0;font-weight:400">· BUILD YOUR NEXT CHAPTER</span></p><p style="margin:0 0 10px;color:#8A2E52;font:700 11px/1.4 Arial,sans-serif;letter-spacing:1.3px;text-transform:uppercase">${escapeHtml(eyebrow || "60-DAY DEVELOPER SPRINT")}</p><h1 style="margin:0;color:#1A1417;font:700 32px/1.12 Georgia,'Times New Roman',serif;letter-spacing:-.5px">${escapeHtml(title)}</h1>${intro ? `<p style="margin:14px 0 0;color:#7A6E74;font:16px/1.65 Arial,Helvetica,sans-serif">${escapeHtml(intro)}</p>` : ""}${content}${action}<p style="margin:26px 0 0;padding-top:17px;border-top:1px solid #E7E0E4;color:#7A6E74;font:12px/1.6 Arial,Helvetica,sans-serif">${footer}</p></td></tr></table><p style="margin:14px 0 0;color:#A2939A;font:11px/1.5 Arial,Helvetica,sans-serif">C# Core · .NET Core · JavaScript · React</p></td></tr></table></body></html>`;
}

export function htmlPage(title, message, tone = "success") {
  const color = tone === "error" ? "#8A2E52" : "#6B2742";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · DevSprint</title><body style="margin:0;padding:40px 16px;background:#FBF9FA;color:#1A1417;font:16px/1.6 Arial,sans-serif"><main style="max-width:520px;margin:8vh auto;padding:36px;border:1px solid #E7E0E4;border-radius:16px;background:#fff"><div style="display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#F6E8EE;color:#8A2E52;font-weight:700;font-family:monospace">&lt;/&gt;</div><p style="margin:22px 0 7px;color:#8A2E52;font-size:11px;letter-spacing:1.2px">DEVSPRINT · DAILY PRACTICE</p><h1 style="margin:0;color:${color};font-size:26px">${escapeHtml(title)}</h1><p style="margin:12px 0 0;color:#7A6E74">${escapeHtml(message)}</p><a href="/" style="display:inline-block;margin-top:23px;padding:11px 16px;border-radius:7px;background:#8A2E52;color:#fff;text-decoration:none;font-size:13px">Back to your sprint →</a></main></body></html>`;
}

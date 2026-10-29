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

export function htmlPage(title, message, tone = "success") {
  const color = tone === "error" ? "#a45248" : "#45694a";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · DevSprint</title><body style="margin:0;padding:40px 16px;background:#f4f6f1;color:#24362b;font:16px/1.6 Arial,sans-serif"><main style="max-width:520px;margin:8vh auto;padding:36px;border:1px solid #e5ebe2;border-radius:16px;background:#fff"><div style="display:inline-grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#eaf2dd;color:#426942;font-weight:700;font-family:monospace">&lt;/&gt;</div><p style="margin:22px 0 7px;color:#82907f;font-size:11px;letter-spacing:1.2px">DEVSPRINT · DAILY PRACTICE</p><h1 style="margin:0;color:${color};font-size:26px">${escapeHtml(title)}</h1><p style="margin:12px 0 0;color:#718075">${escapeHtml(message)}</p><a href="/" style="display:inline-block;margin-top:23px;padding:11px 16px;border-radius:7px;background:#18372a;color:#fff;text-decoration:none;font-size:13px">Back to your sprint →</a></main></body></html>`;
}

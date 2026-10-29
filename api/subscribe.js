import { createHash, randomUUID } from "node:crypto";
import { escapeHtml, redis, sendEmail, siteUrl } from "../server/reminder-services.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST to enroll." });
  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}; }
  catch { return res.status(400).json({ error: "Send a valid enrollment request." }); }
  if (body.website) return res.status(200).json({ message: "Check your inbox for a confirmation link." });

  const email = String(body.email || "").trim().toLowerCase();
  const requestedDate = String(body.startDate || "");
  const parsedDate = DATE_PATTERN.test(requestedDate) ? new Date(`${requestedDate}T00:00:00Z`) : null;
  const startDate = parsedDate && !Number.isNaN(parsedDate.valueOf()) && parsedDate.toISOString().slice(0, 10) === requestedDate ? requestedDate : new Date().toISOString().slice(0, 10);
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return res.status(400).json({ error: "Enter a valid email address." });
  if (body.consent !== true) return res.status(400).json({ error: "Please opt in before enrolling." });

  try {
    const appUrl = siteUrl();
    if (!process.env.RESEND_API_KEY || !process.env.REMINDER_FROM_EMAIL) throw new Error("Email delivery is not configured.");
    const emailKey = createHash("sha256").update(email).digest("hex").slice(0, 32);
    const allowed = await redis(["SET", `reminders:signup-cooldown:${emailKey}`, "1", "EX", "60", "NX"]);
    if (!allowed) return res.status(429).json({ error: "Please wait a minute before requesting another confirmation email." });

    const pendingEmailKey = `reminders:pending-email:${emailKey}`;
    const pendingToken = await redis(["GET", pendingEmailKey]);
    if (pendingToken) await redis(["DEL", `reminders:pending-token:${pendingToken}`]);

    const token = randomUUID();
    await Promise.all([
      redis(["SET", pendingEmailKey, token, "EX", "86400"]),
      redis(["SET", `reminders:pending-token:${token}`, JSON.stringify({ email, startDate, emailKey }), "EX", "86400"])
    ]);

    const confirmUrl = `${appUrl}/api/confirm?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: "Confirm your DevSprint daily reminder",
      html: `<div style="margin:0;padding:32px 16px;background:#f4f6f1;font:15px/1.6 Arial,sans-serif;color:#26372c"><div style="max-width:560px;margin:auto;padding:32px;border:1px solid #e5ebe2;border-radius:14px;background:#fff"><p style="color:#758875;font:11px monospace;letter-spacing:1px">DEVSPRINT · 60-DAY CHALLENGE</p><h1 style="margin:15px 0 8px;color:#1c3b2a;font-size:26px">One good habit starts here.</h1><p style="color:#6f7d72">Confirm your email to receive one daily placement sprint reminder around 9:00 AM India Standard Time.</p><a href="${confirmUrl}" style="display:inline-block;margin-top:12px;padding:12px 18px;border-radius:7px;background:#18372a;color:#fff;text-decoration:none">Confirm daily reminders →</a><p style="margin-top:24px;color:#9aa49b;font-size:11px">If you didn't request this, ignore this email. Your address won't be added unless you confirm.</p><p style="color:#9aa49b;font-size:11px">Sent to ${escapeHtml(email)}</p></div></div>`
    });

    return res.status(200).json({ message: "Check your inbox to confirm your daily reminder." });
  } catch {
    return res.status(503).json({ error: "Daily reminders aren't configured yet. The app owner needs to connect email and subscriber storage." });
  }
}

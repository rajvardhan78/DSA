import { createHash } from "node:crypto";
import { challengeDays } from "../src/data/challenge.js";
import { escapeHtml, redis, sendEmail, siteUrl } from "../server/reminder-services.js";

function dateInKolkata(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function challengeDay(startDate, today) {
  const started = new Date(`${startDate}T00:00:00Z`);
  const current = new Date(`${today}T00:00:00Z`);
  const diff = Math.floor((current - started) / 86_400_000) + 1;
  return diff >= 1 && diff <= 60 ? diff : null;
}

function reminderHtml(day, unsubscribeUrl, appUrl) {
  const problemRows = day.problems.map((problem) => `<li style="padding:8px 0;border-bottom:1px solid #edf0eb;color:#435446"><span style="color:#8b9a8b;font:11px monospace">${escapeHtml(problem.difficulty.toUpperCase())}</span> &nbsp; <a style="color:#365b3d;text-decoration:none" href="${problem.leetcodeUrl}">${escapeHtml(problem.title)} ↗</a> &nbsp; <a style="color:#71885f;font-size:11px" href="${problem.notesUrl}">GFG notes</a></li>`).join("");
  return `<div style="margin:0;padding:32px 16px;background:#f4f6f1;font:14px/1.6 Arial,sans-serif;color:#26372c"><div style="max-width:580px;margin:auto;padding:28px;border:1px solid #e5ebe2;border-radius:14px;background:#fff"><p style="color:#819177;font:10px monospace;letter-spacing:1.1px">DEVSPRINT · DAY ${String(day.day).padStart(2, "0")} OF 60</p><h1 style="margin:12px 0 5px;color:#213d2d;font-size:26px">Your next step is ready.</h1><p style="margin:0;color:#7a887c">${escapeHtml(day.track)} · ${escapeHtml(day.title)}</p><div style="padding:15px;margin:18px 0;border:1px solid #e7efdd;border-radius:8px;background:#f8faef"><strong style="color:#455d43">Today's focus</strong><p style="margin:6px 0 0;color:#788678">${escapeHtml(day.summary)}</p><a href="${day.notesUrl}" style="display:inline-block;margin-top:9px;color:#50784c;font-size:12px">Read today's GFG notes ↗</a></div><strong style="color:#3f5442">Four focused problems</strong><ul style="padding-left:17px;margin:5px 0 18px;list-style:none">${problemRows}</ul><a href="${appUrl}/?view=plan&day=${day.day}" style="display:inline-block;padding:12px 17px;border-radius:7px;background:#18372a;color:#fff;text-decoration:none">Open Day ${String(day.day).padStart(2, "0")} →</a><p style="padding-top:18px;margin-top:20px;border-top:1px solid #edf0eb;color:#9aa49b;font-size:11px">One focused day at a time. <a href="${unsubscribeUrl}" style="color:#71885f">Manage reminders / unsubscribe</a></p></div></div>`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET to run the scheduled reminder." });
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized." });

  try {
    const today = dateInKolkata();
    const appUrl = siteUrl();
    const entries = await redis(["HGETALL", "reminders:subscribers"]);
    if (!Array.isArray(entries)) return res.status(200).json({ sent: 0, skipped: 0 });

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (let index = 0; index < entries.length; index += 2) {
      const email = entries[index];
      let subscriber;
      try { subscriber = JSON.parse(entries[index + 1]); } catch { skipped += 1; continue; }
      const dayNumber = challengeDay(subscriber.startDate, today);
      if (!dayNumber) { skipped += 1; continue; }
      const day = challengeDays[dayNumber - 1];
      const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${encodeURIComponent(subscriber.token)}`;
      try {
        const digest = createHash("sha256").update(email).digest("hex").slice(0, 24);
        const sentKey = `reminders:last-sent:${today}:${digest}`;
        if (await redis(["GET", sentKey])) { skipped += 1; continue; }
        await sendEmail({ to: email, subject: `Day ${String(dayNumber).padStart(2, "0")} is ready · DevSprint`, html: reminderHtml(day, unsubscribeUrl, appUrl) });
        await redis(["SET", sentKey, "1", "EX", "172800", "NX"]);
        sent += 1;
      } catch {
        failed += 1;
      }
    }
    if (failed) return res.status(502).json({ error: "Some reminder emails could not be delivered.", sent, skipped, failed });
    return res.status(200).json({ sent, skipped, failed });
  } catch {
    return res.status(503).json({ error: "The reminder job is not configured or could not reach its services." });
  }
}

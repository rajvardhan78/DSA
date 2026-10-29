import { createHash } from "node:crypto";
import { challengeDays } from "../src/data/challenge.js";
import { currentStreak } from "../server/streak.js";
import { emailService } from "../server/emailService.js";
import { redis, siteUrl } from "../server/reminder-services.js";
const escapeHtml = emailService.escapeHtml;

const DAY_MS = 24 * 60 * 60 * 1000;

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
  const diff = Math.floor((current - started) / DAY_MS) + 1;
  return diff >= 1 && diff <= 60 ? diff : null;
}

function warningBlock(streakCount, hoursLeft = 24) {
  const timeText = hoursLeft === 24 ? "You have a full 24 hours from this email to save it." : `About ${hoursLeft} hours remain in your save window.`;
  return `<div style="margin:18px 0;padding:16px 18px;border:1px solid #E9CBD7;border-radius:10px;background:#F6E8EE"><p style="margin:0 0 5px;color:#8A2E52;font:700 11px/1.4 Courier New,Courier,monospace;letter-spacing:1px">⚠ STREAK AT RISK</p><strong style="color:#1A1417;font:700 18px/1.35 Courier New,Courier,monospace">Keep your ${streakCount}-day streak alive.</strong><p style="margin:7px 0 0;color:#66565E;font:14px/1.55 Courier New,Courier,monospace">${timeText} Solve any one LeetCode problem in the sprint to keep your run going.</p></div>`;
}

function reminderHtml(day, unsubscribeUrl, appUrl, streakMessage = "") {
  const problemRows = day.problems.map((problem) => `<li style="padding:10px 0;border-bottom:1px solid #E7E0E4;color:#1A1417;font:14px/1.5 Courier New,Courier,monospace"><span style="display:inline-block;min-width:58px;color:#7A6E74;font:700 10px/1.4 Courier New,Courier,monospace;letter-spacing:.6px">${escapeHtml(problem.difficulty.toUpperCase())}</span><a style="color:#8A2E52;font-weight:600;text-decoration:none" href="${escapeHtml(problem.leetcodeUrl)}">${escapeHtml(problem.title)} ↗</a><br><span style="display:inline-block;margin:3px 0 0 61px"><a style="color:#7A6E74;font-size:12px" href="${escapeHtml(problem.notesUrl)}">GFG notes →</a></span></li>`).join("");
  const content = `${streakMessage}<div style="margin:20px 0;padding:16px 18px;border:1px solid #E7E0E4;border-radius:10px;background:#FBF9FA"><p style="margin:0 0 7px;color:#8A2E52;font:700 11px/1.4 Courier New,Courier,monospace;letter-spacing:1px">TODAY'S FOCUS</p><strong style="color:#1A1417;font:700 17px/1.4 Courier New,Courier,monospace">${escapeHtml(day.title)}</strong><p style="margin:6px 0 0;color:#7A6E74;font:14px/1.55 Courier New,Courier,monospace">${escapeHtml(day.track)} · ${escapeHtml(day.summary)}</p><a href="${escapeHtml(day.notesUrl)}" style="display:inline-block;margin-top:10px;color:#8A2E52;font:600 13px/1.4 Courier New,Courier,monospace">Read today's GFG notes ↗</a></div><strong style="color:#1A1417;font:700 16px/1.4 Courier New,Courier,monospace">Four focused problems</strong><ul style="padding:0;margin:6px 0 18px;list-style:none">${problemRows}</ul>`;
  return emailService.render({
    preheader: `Day ${String(day.day).padStart(2, "0")} is ready: ${day.title}`,
    eyebrow: `DAY ${String(day.day).padStart(2, "0")} OF 60 · DAILY CHECK-IN`,
    title: "Your next step is ready.",
    intro: `${day.track} · ${day.title}`,
    content,
    actionUrl: `${appUrl}/?view=plan&day=${day.day}`,
    actionLabel: `Open Day ${String(day.day).padStart(2, "0")}`,
    footer: `One focused day at a time. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8A2E52">Manage reminders / unsubscribe</a>`
  });
}

function warningOnlyHtml(streakCount, unsubscribeUrl, appUrl) {
  return emailService.render({
    preheader: `Your ${streakCount}-day DevSprint streak needs a quick save.`,
    eyebrow: "A QUICK STREAK CHECK-IN",
    title: "Keep your streak going.",
    intro: "It's been 24 hours since your last checked-off LeetCode problem.",
    content: warningBlock(streakCount),
    actionUrl: `${appUrl}/?view=overview`,
    actionLabel: "Solve a problem now",
    footer: `You're receiving this because you enrolled in DevSprint reminders. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8A2E52">Unsubscribe</a>`
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET to run the scheduled reminder." });
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized." });

  try {
    const today = dateInKolkata();
    const now = Date.now();
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
      const day = dayNumber ? challengeDays[dayNumber - 1] : null;
      const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${encodeURIComponent(subscriber.token)}`;
      const streak = currentStreak(subscriber, now);
      if (streak.expired) {
        subscriber = { ...subscriber, streakCount: 0, streakStartedAt: null, lastSolvedAt: null, warningSentAt: null };
        await redis(["HSET", "reminders:subscribers", email, JSON.stringify(subscriber)]);
      }
      const lastSolved = subscriber.lastSolvedAt ? Date.parse(subscriber.lastSolvedAt) : NaN;
      const needsWarning = !streak.expired && Number.isFinite(lastSolved) && now - lastSolved >= DAY_MS && !subscriber.warningSentAt;
      if (!day && !needsWarning) { skipped += 1; continue; }

      try {
        const digest = createHash("sha256").update(email).digest("hex").slice(0, 24);
        const sentKey = `reminders:last-sent:${today}:${digest}`;
        if (await redis(["GET", sentKey])) { skipped += 1; continue; }

        const stillAtRisk = !streak.expired && streak.atRisk;
        const warning = needsWarning
          ? warningBlock(Number(subscriber.streakCount) || 1)
          : stillAtRisk ? warningBlock(streak.count, streak.hoursLeft) : "";
        const subject = needsWarning
          ? `⚠ Your ${Number(subscriber.streakCount) || 1}-day streak needs a quick save · DevSprint`
          : day ? `Day ${String(dayNumber).padStart(2, "0")} is ready · DevSprint` : `Your streak needs a quick save · DevSprint`;
        const html = day
          ? reminderHtml(day, unsubscribeUrl, appUrl, warning)
          : warningOnlyHtml(Number(subscriber.streakCount) || 1, unsubscribeUrl, appUrl);
        await emailService.send({ to: email, subject, html });
        await redis(["SET", sentKey, "1", "EX", "172800", "NX"]);
        if (needsWarning) {
          subscriber = { ...subscriber, warningSentAt: new Date(now).toISOString() };
          await redis(["HSET", "reminders:subscribers", email, JSON.stringify(subscriber)]);
        }
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

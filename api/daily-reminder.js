import { createHash } from "node:crypto";
import { challengeDays } from "../src/data/challenge.js";
import { currentStreak } from "../server/streak.js";
import { emailService } from "../server/emailService.js";
import { redis, siteUrl } from "../server/reminder-services.js";
const escapeHtml = emailService.escapeHtml;
const DAILY_CHALLENGE_TEMPLATE_ID = process.env.RESEND_DAILY_TEMPLATE_ID || "4ae162c8-194c-48f8-8689-2a99c84aadd5";

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

function problemsForTemplate(day) {
  const easy = day.problems.filter((problem) => problem.difficulty.toLowerCase() === "easy");
  const medium = day.problems.filter((problem) => problem.difficulty.toLowerCase() === "medium");
  const hard = day.problems.filter((problem) => problem.difficulty.toLowerCase() === "hard");
  if (easy.length < 2 || !medium[0] || !hard[0]) {
    throw new Error(`Day ${day.day} does not have the four expected difficulty levels.`);
  }
  return { easy1: easy[0], easy2: easy[1], medium: medium[0], hard: hard[0] };
}

function streakStatusMessage({ streakCount, needsWarning, stillAtRisk, hoursLeft }) {
  if (needsWarning) {
    return `Your ${streakCount}-day streak is at risk. You have a full 24 hours from this email to solve any one assigned problem and save it.`;
  }
  if (stillAtRisk) {
    return `Your ${streakCount}-day streak is at risk. About ${hoursLeft} hours remain in your save window; solve any one assigned problem to keep it going.`;
  }
  if (streakCount > 0) {
    return `Your ${streakCount}-day streak is active. Solve any one assigned problem today to keep it going.`;
  }
  return "Solve any one assigned problem today to start your streak.";
}

function dailyTemplateVariables({ day, streak, needsWarning, stillAtRisk, unsubscribeUrl, appUrl }) {
  const problems = problemsForTemplate(day);
  const streakCount = streak.expired ? 0 : Number(streak.count) || 0;
  return {
    day_number: day.day,
    track_name: day.track,
    lesson_title: day.title,
    lesson_summary: day.summary,
    gfg_notes_url: day.notesUrl,
    easy_1_title: problems.easy1.title,
    easy_1_leetcode_url: problems.easy1.leetcodeUrl,
    easy_1_gfg_url: problems.easy1.notesUrl,
    easy_2_title: problems.easy2.title,
    easy_2_leetcode_url: problems.easy2.leetcodeUrl,
    easy_2_gfg_url: problems.easy2.notesUrl,
    medium_title: problems.medium.title,
    medium_leetcode_url: problems.medium.leetcodeUrl,
    medium_gfg_url: problems.medium.notesUrl,
    hard_title: problems.hard.title,
    hard_leetcode_url: problems.hard.leetcodeUrl,
    hard_gfg_url: problems.hard.notesUrl,
    streak_count: streakCount,
    streak_status_message: streakStatusMessage({
      streakCount,
      needsWarning,
      stillAtRisk,
      hoursLeft: streak.hoursLeft
    }),
    challenge_url: `${appUrl}/?view=plan&day=${day.day}`,
    unsubscribe_url: unsubscribeUrl
  };
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
        if (day) {
          await emailService.sendTemplate({
            to: email,
            templateId: DAILY_CHALLENGE_TEMPLATE_ID,
            variables: dailyTemplateVariables({ day, streak, needsWarning, stillAtRisk, unsubscribeUrl, appUrl })
          });
        } else {
          const streakCount = Number(subscriber.streakCount) || 1;
          const subject = `⚠ Your ${streakCount}-day streak needs a quick save · DevSprint`;
          const html = warningOnlyHtml(streakCount, unsubscribeUrl, appUrl);
          await emailService.send({ to: email, subject, html });
        }
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

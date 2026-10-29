import { createHash } from "node:crypto";
import { challengeDays } from "../src/data/challenge.js";
import { redis, siteUrl } from "../server/reminder-services.js";
import { recordSolve } from "../server/streak.js";

function activityCookie(req) {
  const cookieHeader = req.headers.cookie || "";
  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("devsprint_activity="));
  if (!pair) return "";
  try { return decodeURIComponent(pair.slice("devsprint_activity=".length)); } catch { return ""; }
}

function sameOrigin(req) {
  const raw = req.headers.origin;
  if (!raw) return false;
  try { return new URL(raw).origin === siteUrl(); } catch { return false; }
}

function publicActivity(subscriber) {
  return {
    subscribed: true,
    streakCount: Math.max(0, Number(subscriber.streakCount) || 0),
    streakStartedAt: subscriber.streakStartedAt || null,
    lastSolvedAt: subscriber.lastSolvedAt || null,
    warningSentAt: subscriber.warningSentAt || null
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Use GET or POST." });
  res.setHeader("Cache-Control", "no-store");
  const activityToken = activityCookie(req);
  if (!/^[0-9a-f-]{36}$/i.test(activityToken)) {
    if (req.method === "GET") return res.status(200).json({ subscribed: false });
    return res.status(401).json({ error: "Confirm a reminder subscription to sync your streak." });
  }

  try {
    const email = await redis(["HGET", "reminders:activity-tokens", activityToken]);
    if (!email) return req.method === "GET"
      ? res.status(200).json({ subscribed: false })
      : res.status(401).json({ error: "Confirm a reminder subscription to sync your streak." });

    const rawSubscriber = await redis(["HGET", "reminders:subscribers", email]);
    if (!rawSubscriber) return res.status(401).json({ error: "This reminder subscription is no longer active." });
    let subscriber = JSON.parse(rawSubscriber);
    if (subscriber.activityToken !== activityToken) return res.status(401).json({ error: "This reminder subscription is no longer active." });

    if (req.method === "GET") return res.status(200).json(publicActivity(subscriber));
    if (!sameOrigin(req)) return res.status(403).json({ error: "Activity updates must come from this site." });

    let body;
    try { body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}; }
    catch { return res.status(400).json({ error: "Send a valid activity update." }); }
    const dayNumber = Number(body.day);
    const problemId = String(body.problemId || "");
    const activityId = String(body.activityId || "");
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 60 || !challengeDays[dayNumber - 1]?.problems.some((problem) => String(problem.id) === problemId)) {
      return res.status(400).json({ error: "Choose a problem from the sprint." });
    }
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(activityId)) return res.status(400).json({ error: "Send a valid activity identifier." });

    const activityDigest = createHash("sha256").update(`${activityToken}:${activityId}`).digest("hex").slice(0, 32);
    const firstDelivery = await redis(["SET", `reminders:activity-event:${activityDigest}`, "1", "EX", "172800", "NX"]);
    if (firstDelivery) {
      subscriber = recordSolve(subscriber);
      await redis(["HSET", "reminders:subscribers", email, JSON.stringify(subscriber)]);
    }
    return res.status(200).json(publicActivity(subscriber));
  } catch {
    return res.status(503).json({ error: "Streak sync is temporarily unavailable." });
  }
}

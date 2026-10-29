import { htmlPage, redis } from "../server/reminder-services.js";
import { createHash } from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  const token = String(req.query?.token || "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return res.status(400).send(htmlPage("That link didn't work", "Open the newest confirmation email and try its link again.", "error"));

  try {
    const record = await redis(["GET", `reminders:pending-token:${token}`]);
    if (!record) return res.status(410).send(htmlPage("This link has expired", "Enroll again from the reminders page to get a fresh confirmation link.", "error"));
    const { email, startDate, emailKey } = JSON.parse(record);
    const currentToken = await redis(["GET", `reminders:pending-email:${emailKey || createHash("sha256").update(email).digest("hex").slice(0, 32)}`]);
    if (currentToken !== token) return res.status(410).send(htmlPage("This link has expired", "Enroll again from the reminders page to get a fresh confirmation link.", "error"));

    await Promise.all([
      redis(["HSET", "reminders:subscribers", email, JSON.stringify({ token, startDate })]),
      redis(["HSET", "reminders:token-email", token, email]),
      redis(["DEL", `reminders:pending-email:${emailKey || createHash("sha256").update(email).digest("hex").slice(0, 32)}`]),
      redis(["DEL", `reminders:pending-token:${token}`])
    ]);
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.status(200).send(htmlPage("You're on the list", "Your daily DevSprint reminder is confirmed. Look for a short practice plan around 9:00 AM IST."));
  } catch {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.status(503).send(htmlPage("We couldn't confirm that yet", "Please try again in a moment. Your reminder settings haven't been changed.", "error"));
  }
}

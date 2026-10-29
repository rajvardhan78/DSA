import { escapeHtml, htmlPage, redis } from "../server/reminder-services.js";

function formPage(token) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe · DevSprint</title><body style="margin:0;padding:40px 16px;background:#FBF9FA;color:#1A1417;font:15px/1.6 Arial,sans-serif"><main style="max-width:520px;margin:8vh auto;padding:36px;border:1px solid #E7E0E4;border-radius:16px;background:#fff"><p style="color:#8A2E52;font:11px monospace;letter-spacing:1.2px">DEVSPRINT · EMAIL PREFERENCES</p><h1 style="margin:0;color:#1A1417;font-size:28px">Pause the daily notes?</h1><p style="color:#7A6E74">Unsubscribe this address from future placement sprint reminders.</p><form method="post" action="/api/unsubscribe"><input type="hidden" name="token" value="${escapeHtml(token)}"><button style="margin-top:12px;padding:12px 16px;border:0;border-radius:7px;background:#8A2E52;color:#fff;font-size:14px;cursor:pointer">Unsubscribe me</button></form><a href="/" style="display:inline-block;margin-top:16px;color:#8A2E52;font-size:13px">Keep my reminders</a></main></body></html>`;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const token = String(req.query?.token || "");
    if (!/^[0-9a-f-]{36}$/i.test(token)) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(400).send(htmlPage("Invalid unsubscribe link", "Please use the link from a DevSprint reminder email.", "error"));
    }
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.status(200).send(formPage(token));
  }
  if (req.method !== "POST") return res.status(405).send("Method not allowed");
  const body = typeof req.body === "string" ? new URLSearchParams(req.body) : req.body || {};
  const token = String(body instanceof URLSearchParams ? body.get("token") || "" : body.token || "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return res.status(400).send(htmlPage("Invalid unsubscribe link", "Please use the link from a DevSprint reminder email.", "error"));

  try {
    const email = await redis(["HGET", "reminders:token-email", token]);
    if (!email || email.startsWith("pending:")) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(410).send(htmlPage("You're already unsubscribed", "No further daily reminders will be sent to this address."));
    }
    const record = await redis(["HGET", "reminders:subscribers", email]);
    if (!record || JSON.parse(record).token !== token) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.status(410).send(htmlPage("You're already unsubscribed", "No further daily reminders will be sent to this address."));
    }
    const subscriber = JSON.parse(record);
    await Promise.all([
      redis(["HDEL", "reminders:subscribers", email]),
      redis(["HDEL", "reminders:token-email", token]),
      ...(subscriber.activityToken ? [redis(["HDEL", "reminders:activity-tokens", subscriber.activityToken])] : [])
    ]);
    res.setHeader("Set-Cookie", "devsprint_activity=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.status(200).send(htmlPage("You're unsubscribed", "Your address has been removed from future DevSprint reminders."));
  } catch {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res.status(503).send(htmlPage("We couldn't update that yet", "Please try again shortly. Your reminder settings haven't been changed.", "error"));
  }
}

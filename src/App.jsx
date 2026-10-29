import { useEffect, useState } from "react";
import ChallengePage from "./ChallengePage.jsx";
import { recordLocalSolve } from "./streak.js";

const STORAGE_KEY = "devsprint:progress:v1";

function localDateKey() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return {
      launchDate: value?.launchDate || localDateKey(),
      done: value?.done && typeof value.done === "object" ? value.done : {},
      labs: value?.labs && typeof value.labs === "object" ? value.labs : {},
      streakCount: Math.max(0, Number(value?.streakCount) || 0),
      streakStartedAt: typeof value?.streakStartedAt === "string" ? value.streakStartedAt : null,
      lastSolvedAt: typeof value?.lastSolvedAt === "string" ? value.lastSolvedAt : null,
      warningSentAt: typeof value?.warningSentAt === "string" ? value.warningSentAt : null
    };
  } catch {
    return { launchDate: localDateKey(), done: {}, labs: {}, streakCount: 0, streakStartedAt: null, lastSolvedAt: null, warningSentAt: null };
  }
}

function dayFromStart(startDate) {
  const start = new Date(String(startDate || localDateKey()) + "T00:00:00Z");
  const today = new Date(localDateKey() + "T00:00:00Z");
  return Math.max(1, Math.min(60, Math.floor((today - start) / 86400000) + 1));
}

function validDayFromUrl() {
  const day = Number(new URLSearchParams(window.location.search).get("day"));
  return Number.isInteger(day) && day >= 1 && day <= 60 ? day : null;
}

function validPageFromUrl() {
  const page = new URLSearchParams(window.location.search).get("view");
  return ["overview", "plan", "projects", "reminders"].includes(page) ? page : "overview";
}

export default function App() {
  const [saved, setSaved] = useState(readProgress);
  const todayDay = dayFromStart(saved.launchDate);
  const [selectedDay, setSelectedDay] = useState(() => validDayFromUrl() || todayDay);
  const [activeNav, setActiveNav] = useState(validPageFromUrl);
  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [emailState, setEmailState] = useState({ kind: "idle", message: "" });
  const [activitySubscribed, setActivitySubscribed] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  useEffect(() => {
    let active = true;
    async function syncActivity() {
      try {
        const response = await fetch("/api/activity", { headers: { accept: "application/json" } });
        if (!response.ok) return;
        const activity = await response.json();
        if (!active) return;
        setActivitySubscribed(Boolean(activity.subscribed));
        if (activity.subscribed) {
          setSaved((current) => {
            const serverTime = Date.parse(activity.lastSolvedAt || "");
            const localTime = Date.parse(current.lastSolvedAt || "");
            if (!Number.isFinite(serverTime) || (Number.isFinite(localTime) && localTime > serverTime)) return current;
            return {
              ...current,
              streakCount: Math.max(0, Number(activity.streakCount) || 0),
              streakStartedAt: activity.streakStartedAt || null,
              lastSolvedAt: activity.lastSolvedAt || null,
              warningSentAt: activity.warningSentAt || null
            };
          });
        }
      } catch {
        // Local streak tracking continues when the reminder service is unavailable.
      }
    }
    syncActivity();
    const interval = window.setInterval(syncActivity, 15 * 60 * 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  function openPage(page, targetDay) {
    setActiveNav(page);
    if (Number.isInteger(targetDay) && targetDay >= 1 && targetDay <= 60) setSelectedDay(targetDay);
    const url = new URL(window.location.href);
    url.searchParams.set("view", page);
    if (Number.isInteger(targetDay) && targetDay >= 1 && targetDay <= 60) url.searchParams.set("day", String(targetDay));
    window.history.replaceState({}, "", url);
  }

  function toggleDone(key) {
    const solve = !saved.done[key] && key.match(/^(\d+):problem:(\d+)$/);
    setSaved((current) => ({
      ...current,
      done: { ...current.done, [key]: !current.done[key] },
      ...(solve ? recordLocalSolve(current) : {})
    }));
    if (solve) {
      const activityId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      fetch("/api/activity", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ day: Number(solve[1]), problemId: solve[2], activityId })
      }).then(async (response) => {
        if (!response.ok) return;
        const activity = await response.json();
        setActivitySubscribed(Boolean(activity.subscribed));
        if (!activity.subscribed) return;
        setSaved((current) => ({
          ...current,
          streakCount: Math.max(0, Number(activity.streakCount) || 0),
          streakStartedAt: activity.streakStartedAt || null,
          lastSolvedAt: activity.lastSolvedAt || current.lastSolvedAt,
          warningSentAt: activity.warningSentAt || null
        }));
      }).catch(() => {});
    }
  }

  async function enroll(event) {
    event.preventDefault();
    setEmailState({ kind: "loading", message: "Sending your confirmation link…" });
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent: consented, startDate: saved.launchDate })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The reminder service is not configured yet.");
      setEmailState({ kind: "success", message: payload.message || "Check your inbox to confirm your daily reminder." });
      setEmail("");
    } catch (error) {
      setEmailState({ kind: "error", message: error.message || "We couldn't enroll that address. Please try again." });
    }
  }

  return <ChallengePage
    activeNav={activeNav}
    saved={saved}
    setSaved={setSaved}
    todayDay={todayDay}
    selectedDay={selectedDay}
    toggleDone={toggleDone}
    openPage={openPage}
    email={email}
    setEmail={setEmail}
    consented={consented}
    setConsented={setConsented}
    emailState={emailState}
    onSubmit={enroll}
    activitySubscribed={activitySubscribed}
  />;
}


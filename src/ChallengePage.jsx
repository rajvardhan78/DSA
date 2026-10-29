import { useEffect, useMemo, useState } from "react";
import { challengeDays, projectLabs, trackMeta } from "./data/challenge.js";

const TOTAL_TASKS = challengeDays.length * 5;
const PHASE_LABELS = {
  "C# CORE": "C# Core",
  ".NET CORE": ".NET Core",
  JAVASCRIPT: "JavaScript",
  REACT: "React"
};
const problemKey = (day, id) => `${day}:problem:${id}`;
const lessonKey = (day) => `${day}:lesson`;

function dayComplete(day, done) {
  return Boolean(done[lessonKey(day.day)] && day.problems.every((problem) => done[problemKey(day.day, problem.id)]));
}

function b64Encode(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}

function b64Decode(value) {
  const bytes = Uint8Array.from(atob(value.trim()), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function ChallengePage({
  activeNav, saved, setSaved, todayDay, selectedDay, toggleDone, openPage,
  email, setEmail, consented, setConsented, emailState, onSubmit
}) {
  const [filter, setFilter] = useState("all");
  const [hideDone, setHideDone] = useState(false);
  const [openDay, setOpenDay] = useState(selectedDay);
  const [backupCode, setBackupCode] = useState("");
  const [backupNotice, setBackupNotice] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("devsprint:theme") || "system");
  const currentThemeIsDark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = theme;
    localStorage.setItem("devsprint:theme", theme);
  }, [theme]);

  useEffect(() => {
    setOpenDay(selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    if (activeNav !== "plan") return;
    window.requestAnimationFrame(() => document.getElementById(`sprint-day-${selectedDay}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [activeNav, selectedDay]);

  const daysCompleted = useMemo(() => challengeDays.filter((day) => dayComplete(day, saved.done)).length, [saved.done]);
  const problemsSolved = useMemo(() => challengeDays.reduce((sum, day) => sum + day.problems.filter((problem) => saved.done[problemKey(day.day, problem.id)]).length, 0), [saved.done]);
  const lessonsDone = useMemo(() => challengeDays.filter((day) => saved.done[lessonKey(day.day)]).length, [saved.done]);
  const completedTasks = problemsSolved + lessonsDone;
  const progress = Math.round((completedTasks / TOTAL_TASKS) * 100);
  const hours = Math.round(lessonsDone * 0.25 + problemsSolved * 0.33);
  const dayFilter = filter === "all" ? null : filter;

  const visibleTracks = trackMeta.filter((track) => !dayFilter || PHASE_LABELS[challengeDays[track.range[0] - 1].track] === dayFilter);

  function visitCurrentDay() {
    setHideDone(false);
    const track = challengeDays[todayDay - 1].track;
    setFilter(PHASE_LABELS[track]);
    setOpenDay(todayDay);
    openPage("plan", todayDay);
    window.setTimeout(() => document.getElementById(`sprint-day-${todayDay}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function toggleTheme() {
    setTheme(currentThemeIsDark ? "light" : "dark");
  }

  async function copyBackup() {
    const code = b64Encode(saved);
    setBackupCode(code);
    try {
      await navigator.clipboard.writeText(code);
      setBackupNotice("Backup code copied. Paste it on another device to restore your progress.");
    } catch {
      setBackupNotice("Backup code is ready below. Select and copy it to keep a safe copy.");
    }
  }

  function restoreBackup() {
    try {
      const restored = b64Decode(backupCode);
      if (!restored || typeof restored !== "object" || !restored.done || typeof restored.done !== "object") throw new Error("Invalid backup");
      setSaved({
        launchDate: /^\d{4}-\d{2}-\d{2}$/.test(restored.launchDate || "") ? restored.launchDate : saved.launchDate,
        done: restored.done,
        labs: restored.labs && typeof restored.labs === "object" ? restored.labs : {}
      });
      setBackupNotice("Progress restored on this device.");
    } catch {
      setBackupNotice("That code doesn't look right. Check the text and try again.");
    }
  }

  function resetProgress() {
    if (!window.confirm("Reset all challenge and project progress on this device? This can't be undone unless you saved a backup code.")) return;
    const today = new Date();
    const launchDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSaved({ launchDate, done: {}, labs: {} });
    setBackupCode("");
    setBackupNotice("Progress reset. Your challenge starts from Day 01 today.");
    openPage("overview", 1);
  }

  const dateLabel = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short" }).format(new Date());

  return <div className="replica-app">
    <header className="replica-top">
      <div className="replica-top-inner">
        <div className="replica-brand-row">
          <div>
            <div className="replica-brand">DEVSprint <span>·</span> BUILD YOUR NEXT CHAPTER</div>
            <h1>60-Day Developer Sprint</h1>
            <p className="replica-sub">C# Core → .NET Core → JavaScript → React. One focused lesson and four LeetCode problems a day.</p>
          </div>
          <div className="replica-header-actions">
            <span className="replica-date">{dateLabel} <i /> DAY {String(todayDay).padStart(2, "0")}</span>
            <button className="replica-button" onClick={visitCurrentDay}>Go to current day <span>↓</span></button>
            <button className="replica-theme-button" onClick={toggleTheme} aria-label={`Switch to ${currentThemeIsDark ? "light" : "dark"} theme`}>{currentThemeIsDark ? "☼" : "☾"}</button>
          </div>
        </div>
        <div className="replica-meter"><div className="replica-meter-track"><i style={{ width: `${progress}%` }} /></div><strong>{progress}%</strong></div>
        <div className="replica-tiles">
          <MetricTile value={`${daysCompleted}/60`} label="Days done" />
          <MetricTile value={`${lessonsDone}/60`} label="GFG readings" />
          <MetricTile value={`${problemsSolved}/240`} label="Problems solved" />
          <MetricTile value={`${hours}h`} label="Est. practice" />
        </div>
        <div className="replica-tabs" aria-label="Sprint sections">
          <button className={activeNav === "overview" || activeNav === "plan" ? "selected" : ""} onClick={() => openPage("overview", todayDay)}>60-day challenge</button>
          <button className={activeNav === "projects" ? "selected" : ""} onClick={() => openPage("projects")}>Project lab</button>
          <button className={activeNav === "reminders" ? "selected" : ""} onClick={() => openPage("reminders")}>Daily reminders</button>
        </div>
      </div>
    </header>

    <main className="replica-wrap">
      {(activeNav === "overview" || activeNav === "plan") && <>
        <div className="replica-toolbar">
          <div className="replica-filters" aria-label="Filter challenge days">
            {["All", "C# Core", ".NET Core", "JavaScript", "React"].map((label) => <button key={label} className={`replica-chip ${filter === (label === "All" ? "all" : label) ? "pressed" : ""}`} aria-pressed={filter === (label === "All" ? "all" : label)} onClick={() => setFilter(label === "All" ? "all" : label)}>{label}</button>)}
          </div>
          <button className={`replica-chip hide-chip ${hideDone ? "pressed" : ""}`} aria-pressed={hideDone} onClick={() => setHideDone((value) => !value)}>{hideDone ? "Show done" : "Hide done"}</button>
        </div>

        {visibleTracks.map((track) => {
          const days = challengeDays.slice(track.range[0] - 1, track.range[1]).filter((day) => !hideDone || !dayComplete(day, saved.done));
          const completed = challengeDays.slice(track.range[0] - 1, track.range[1]).filter((day) => dayComplete(day, saved.done)).length;
          if (!days.length) return null;
          return <section className="replica-phase" key={track.name}>
            <div className="replica-phase-heading"><span className="replica-phase-number">{track.label}</span><h2>{track.name}</h2><span className="replica-phase-range">DAYS {track.range[0]}–{track.range[1]}</span><i /><span className="replica-phase-count">{completed}/15 complete</span></div>
            <div className="replica-day-list">{days.map((day) => <DayCard
              key={day.day}
              day={day}
              todayDay={todayDay}
              open={openDay === day.day}
              complete={dayComplete(day, saved.done)}
              done={saved.done}
              toggleDone={toggleDone}
              onToggle={(event) => {
                if (event.currentTarget.open) {
                  setOpenDay(day.day);
                  if (selectedDay !== day.day) openPage("plan", day.day);
                } else if (openDay === day.day) setOpenDay(null);
              }}
            />)}</div>
          </section>;
        })}
        {hideDone && challengeDays.every((day) => dayComplete(day, saved.done)) && <div className="replica-empty"><span>✳</span><strong>You've cleared the whole sprint.</strong><p>Every day is complete. Nice work.</p><button className="replica-button" onClick={() => setHideDone(false)}>Show all days</button></div>}
      </>}

      {activeNav === "projects" && <ProjectLab saved={saved} setSaved={setSaved} openPage={openPage} />}
      {activeNav === "reminders" && <ReminderPage
        email={email} setEmail={setEmail} consented={consented} setConsented={setConsented}
        emailState={emailState} onSubmit={onSubmit} todayDay={todayDay}
      />}

      <footer className="replica-footer">
        {(activeNav === "overview" || activeNav === "plan") && <>
          <div className="replica-rhythm"><strong>Rozana rhythm —</strong> Read the notes, work through today's four problems, then mark the next step for tomorrow. If you're stuck, study a solution and retry it the next day.</div>
          <div className="replica-backup-actions"><button onClick={copyBackup}>Copy backup code</button><button onClick={restoreBackup}>Restore from code</button><button className="reset-button" onClick={resetProgress}>Reset progress</button></div>
          <textarea className="replica-backup-code" value={backupCode} onChange={(event) => setBackupCode(event.target.value)} spellCheck="false" aria-label="Progress backup code" placeholder="Copy your backup code here, or paste one here and choose Restore." />
          {backupNotice && <p className="backup-notice" role="status">{backupNotice}</p>}
        </>}
        <div className="replica-footer-bottom"><span>60 days · 240 problems · GFG notes · four focused stacks</span><span>Progress saves in this browser</span></div>
      </footer>
    </main>
  </div>;
}

function MetricTile({ value, label }) {
  return <div className="replica-tile"><strong>{value}</strong><span>{label}</span></div>;
}

function DayCard({ day, todayDay, open, complete, done, toggleDone, onToggle }) {
  const completed = day.problems.filter((problem) => done[problemKey(day.day, problem.id)]).length + Number(Boolean(done[lessonKey(day.day)]));
  return <details className={`replica-day ${complete ? "done" : ""} ${todayDay === day.day ? "is-today" : ""}`} id={`sprint-day-${day.day}`} open={open} onToggle={onToggle}>
    <summary>
      <span className="replica-day-number">{complete ? "✓" : String(day.day).padStart(2, "0")}</span>
      <span className="replica-day-title"><strong>{day.title}</strong><small>{PHASE_LABELS[day.track]} <i>·</i> {day.problems.length} problems <i>·</i> {completed}/5 complete {todayDay === day.day && <b>TODAY</b>}</small></span>
      <span className="replica-mini"><i style={{ width: `${(completed / 5) * 100}%` }} /></span>
      <span className="replica-caret">›</span>
    </summary>
    <div className="replica-day-body">
      <div className="replica-section-title">READ THE NOTES <span>· 15–25 MIN</span></div>
      <div className={`replica-task-row ${done[lessonKey(day.day)] ? "task-done" : ""}`}>
        <input type="checkbox" checked={Boolean(done[lessonKey(day.day)])} onChange={() => toggleDone(lessonKey(day.day))} aria-label={`Mark ${day.title} notes complete`} />
        <span className="replica-task-kind reading">GFG</span>
        <div className="replica-task-copy"><strong>{day.title}</strong><small>{day.summary}</small></div>
        <a className="replica-notes-link" href={day.notesUrl} target="_blank" rel="noreferrer">GFG notes ↗</a>
      </div>
      <div className="replica-section-title problem-heading">LEETCODE PRACTICE <span>· 2 EASY · 1 MEDIUM · 1 HARD</span></div>
      <ul className="replica-problem-list">{day.problems.map((problem) => {
        const key = problemKey(day.day, problem.id);
        return <li className={`replica-task-row ${done[key] ? "task-done" : ""}`} key={problem.id}>
          <input type="checkbox" checked={Boolean(done[key])} onChange={() => toggleDone(key)} aria-label={`Mark ${problem.title} solved`} />
          <span className={`replica-task-kind ${problem.difficulty.toLowerCase()}`}>{problem.difficulty[0]}</span>
          <div className="replica-task-copy"><a href={problem.leetcodeUrl} target="_blank" rel="noreferrer"><strong>{problem.title}</strong><small>LeetCode #{problem.id} <span>↗</span></small></a></div>
          <a className="replica-notes-link" href={problem.notesUrl} target="_blank" rel="noreferrer">GFG notes ↗</a>
        </li>;
      })}</ul>
      <div className="replica-day-note"><span>✳</span><div><strong>Today's focus</strong><p>{day.summary}</p></div><a href={day.guideUrl} target="_blank" rel="noreferrer">Open {day.track === "JAVASCRIPT" ? "JavaScript" : day.track === "REACT" ? "React" : day.track === ".NET CORE" ? ".NET Core" : "C#"} guide ↗</a></div>
    </div>
  </details>;
}

function ProjectLab({ saved, setSaved, openPage }) {
  const [expanded, setExpanded] = useState(projectLabs[0].id);
  const buildSteps = projectLabs.reduce((sum, project) => sum + project.skills.filter((_, index) => saved.labs[`${project.id}:${index}`]).length, 0);
  function toggle(projectId, index) {
    const key = `${projectId}:${index}`;
    setSaved((current) => ({ ...current, labs: { ...current.labs, [key]: !current.labs[key] } }));
  }
  return <section className="replica-secondary-page">
    <div className="replica-page-intro"><span className="replica-section-kicker">BUILD WHILE YOU LEARN</span><h2>Turn knowledge into proof.</h2><p>Four small, portfolio-ready projects connect the daily lessons to the work you'll do on a real team.</p></div>
    <div className="replica-project-summary"><span>⌘</span><div><strong>{buildSteps} of 16 build steps complete</strong><small>Every project grows out of the sprint. Keep each slice small and shippable.</small></div></div>
    <div className="replica-project-grid">{projectLabs.map((project, index) => {
      const count = project.skills.filter((_, skillIndex) => saved.labs[`${project.id}:${skillIndex}`]).length;
      const isExpanded = expanded === project.id;
      return <article className={`replica-project-card card-${index + 1}`} key={project.id}>
        <button className="replica-project-head" onClick={() => setExpanded(isExpanded ? "" : project.id)} aria-expanded={isExpanded}><span className="replica-project-number">0{index + 1}</span><span><small>{project.subtitle}</small><strong>{project.title}</strong></span><b>{isExpanded ? "−" : "+"}</b></button>
        <p>{project.description}</p><div className="replica-project-progress"><i style={{ width: `${(count / project.skills.length) * 100}%` }} /></div><div className="replica-project-count"><span>{count}/{project.skills.length} build steps</span><span>{Math.round((count / project.skills.length) * 100)}%</span></div>
        {isExpanded && <div className="replica-project-checklist">{project.skills.map((skill, skillIndex) => { const key = `${project.id}:${skillIndex}`; const checked = Boolean(saved.labs[key]); return <label key={skill} className={checked ? "checked" : ""}><input type="checkbox" checked={checked} onChange={() => toggle(project.id, skillIndex)} /><span>{skill}</span></label>; })}</div>}
        <div className="replica-project-footer">{count === project.skills.length ? "READY TO SHARE" : "NEXT STEP: BUILD A SMALL SLICE"}<span>↗</span></div>
      </article>;
    })}</div>
    <div className="replica-capstone"><span>✳</span><div><small>THE FINISH LINE</small><strong>Ship the app. Tell the story.</strong><p>Day 60 wraps with a React capstone, a deployment checklist, and a clean README for your portfolio.</p></div><button onClick={() => openPage("plan", 60)}>Day 60 ↗</button></div>
  </section>;
}

function ReminderPage({ email, setEmail, consented, setConsented, emailState, onSubmit, todayDay }) {
  const day = challengeDays[todayDay - 1];
  return <section className="replica-secondary-page">
    <div className="replica-page-intro"><span className="replica-section-kicker">A LITTLE NUDGE, ON TIME</span><h2>Let tomorrow find you ready.</h2><p>Get a short daily note with your current lesson, four LeetCode problems, and the GFG notes to go with them.</p></div>
    <div className="replica-reminder-layout">
      <div className="replica-reminder-card">
        <div className="replica-reminder-top"><span className="replica-bell">♧</span><span><i /> DAILY · 9:00 AM IST</span></div>
        <span className="replica-section-kicker">YOUR DAILY CHECK-IN</span><h3>Keep the streak<br /><em>in motion.</em></h3><p>One useful email a day. Start with your next lesson, work through the problem set, and take your progress with you.</p>
        <form className="replica-reminder-form" onSubmit={onSubmit}>
          <label htmlFor="reminder-email">EMAIL ADDRESS</label><input id="reminder-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <label className="replica-consent"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} required /><span>I want to receive one daily placement sprint reminder. I can unsubscribe anytime.</span></label>
          <button className="replica-button submit" type="submit" disabled={emailState.kind === "loading" || !consented}>{emailState.kind === "loading" ? "Sending confirmation…" : "Enroll for daily reminders"} <span>→</span></button>
          {emailState.message && <div className={`replica-message ${emailState.kind}`} role="status">{emailState.kind === "success" ? "✓" : emailState.kind === "error" ? "!" : "·"} {emailState.message}</div>}
        </form>
        <div className="replica-privacy">◎ <span>Your email is used only for sprint reminders. Challenge progress stays in your browser.</span></div>
      </div>
      <aside className="replica-reminder-side">
        <div className="replica-email-preview"><div className="preview-bar"><b>&lt;/&gt;</b><span>PREVIEW · 9:00 AM</span><i>···</i></div><div className="preview-body"><small>GOOD MORNING. DAY {String(todayDay).padStart(2, "0")} IS READY.</small><h3>Small steps.<br />Real progress.</h3><p>Your next focused session is waiting.</p><div className="preview-lesson"><span>01</span><div><strong>{day.title}</strong><small>{day.track} · GFG notes</small></div><b>↗</b></div><div className="preview-problem-count">4 LEETCODE PROBLEMS <span>2 easy · 1 medium · 1 hard</span></div><div className="preview-skeleton"><i /><i /><i /></div><footer>YOU'RE GETTING CLOSER. KEEP GOING ✳</footer></div></div>
        <div className="replica-how"><span className="replica-section-kicker">HOW IT WORKS</span><p><b>01 · Confirm once.</b> We'll send a confirmation link first.</p><p><b>02 · One email each morning.</b> Your day plan and notes arrive around 9 AM IST.</p><p><b>03 · Leave anytime.</b> Each reminder includes an unsubscribe link.</p></div>
      </aside>
    </div>
    <p className="replica-reminder-setup">Email reminders activate after deployment when Resend and Upstash credentials are set. Setup instructions are in <code>README.md</code>.</p>
  </section>;
}

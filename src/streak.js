const DAY_MS = 24 * 60 * 60 * 1000;

function timeValue(value) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
}

export function streakStatus(progress, now = Date.now(), emailSubscribed = false) {
  const lastSolved = timeValue(progress.lastSolvedAt);
  const count = Math.max(0, Number(progress.streakCount) || 0);
  if (!lastSolved || count === 0) return { count: 0, atRisk: false, lost: false, hoursLeft: 0 };

  const warningSent = timeValue(progress.warningSentAt);
  const graceEnds = warningSent
    ? warningSent + DAY_MS
    : emailSubscribed ? Infinity : lastSolved + 2 * DAY_MS;
  const elapsed = Math.max(0, now - lastSolved);
  const atRisk = elapsed >= DAY_MS;
  if (now >= graceEnds) return { count: 0, atRisk: false, lost: true, previousCount: count, hoursLeft: 0 };

  return {
    count,
    atRisk,
    lost: false,
    hoursLeft: Number.isFinite(graceEnds) ? Math.max(0, Math.ceil((graceEnds - now) / 3_600_000)) : null
  };
}

export function recordLocalSolve(progress, now = Date.now()) {
  const previousAt = timeValue(progress.lastSolvedAt);
  const currentStatus = streakStatus(progress, now, false);
  let nextCount = currentStatus.count;
  let streakStartedAt = timeValue(progress.streakStartedAt);

  if (!previousAt || currentStatus.lost || nextCount === 0) {
    nextCount = 1;
    streakStartedAt = now;
  } else {
    streakStartedAt = streakStartedAt || previousAt;
    nextCount = Math.max(nextCount, Math.min(nextCount + 1, Math.floor((now - streakStartedAt) / DAY_MS) + 1));
  }

  return {
    streakCount: nextCount,
    streakStartedAt: new Date(streakStartedAt || now).toISOString(),
    lastSolvedAt: new Date(now).toISOString(),
    warningSentAt: null
  };
}


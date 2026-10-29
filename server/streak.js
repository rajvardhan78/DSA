const DAY_MS = 24 * 60 * 60 * 1000;

function timestamp(value) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function recordSolve(subscriber, now = Date.now()) {
  const lastSolved = timestamp(subscriber.lastSolvedAt);
  const warningSent = timestamp(subscriber.warningSentAt);
  const count = Math.max(0, Number(subscriber.streakCount) || 0);
  let streakStartedAt = timestamp(subscriber.streakStartedAt);
  const graceEnds = warningSent ? warningSent + DAY_MS : lastSolved ? lastSolved + 2 * DAY_MS : null;
  const expired = Boolean(lastSolved && graceEnds && now >= graceEnds);

  let streakCount = count;
  if (!lastSolved || count === 0 || expired) {
    streakCount = 1;
    streakStartedAt = now;
  } else {
    streakStartedAt = streakStartedAt || lastSolved;
    streakCount = Math.max(count, Math.min(count + 1, Math.floor((now - streakStartedAt) / DAY_MS) + 1));
  }

  return { ...subscriber, streakCount, streakStartedAt: new Date(streakStartedAt || now).toISOString(), lastSolvedAt: new Date(now).toISOString(), warningSentAt: null };
}

export function currentStreak(subscriber, now = Date.now()) {
  const lastSolved = timestamp(subscriber.lastSolvedAt);
  const warningSent = timestamp(subscriber.warningSentAt);
  const count = Math.max(0, Number(subscriber.streakCount) || 0);
  if (!lastSolved || count === 0) return { count: 0, atRisk: false, expired: false, hoursLeft: 0 };

  const graceEnds = warningSent ? warningSent + DAY_MS : lastSolved + 2 * DAY_MS;
  const elapsed = Math.max(0, now - lastSolved);
  if (now >= graceEnds) return { count: 0, previousCount: count, atRisk: false, expired: true, hoursLeft: 0 };
  return {
    count,
    atRisk: elapsed >= DAY_MS,
    expired: false,
    hoursLeft: Math.max(0, Math.ceil((graceEnds - now) / 3_600_000))
  };
}


// Client-side only (FR-006): this slows casual guessing but is NOT a security control.
// shortcut: a determined attacker can clear localStorage or call Auth directly; add server-side limits (Supabase Auth rate limits / CAPTCHA) if abuse appears.
const KEY = 'admin-signin-throttle'
const MAX_FAILURES = 3
const LOCK_MS = 15 * 60 * 1000

interface Store { getItem(k: string): string | null, setItem(k: string, v: string): void, removeItem(k: string): void }
interface State { failures: number, lockedUntil: number }

function read(s: Store): State {
  try {
    const v = JSON.parse(s.getItem(KEY) ?? '')
    if (typeof v.failures === 'number' && typeof v.lockedUntil === 'number') return v
  } catch { /* corrupt or empty: start fresh */ }
  return { failures: 0, lockedUntil: 0 }
}

export function checkThrottle(s: Store, now = Date.now()): { blocked: boolean, retryAt?: number } {
  const { lockedUntil } = read(s)
  return lockedUntil > now ? { blocked: true, retryAt: lockedUntil } : { blocked: false }
}

export function recordFailure(s: Store, now = Date.now()) {
  const cur = read(s)
  const expired = cur.lockedUntil !== 0 && cur.lockedUntil <= now
  const failures = (expired ? 0 : cur.failures) + 1
  s.setItem(KEY, JSON.stringify({ failures, lockedUntil: failures >= MAX_FAILURES ? now + LOCK_MS : 0 }))
}

export function resetThrottle(s: Store) {
  s.removeItem(KEY)
}

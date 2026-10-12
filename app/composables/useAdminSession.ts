import { useSupabase } from '~/composables/useSupabase'
import { checkThrottle, recordFailure, resetThrottle } from '~/utils/throttle'

let wasSignedIn = false

// UI gating only: RLS is the real boundary.
export function useAdminSession() {
  const sb = () => useSupabase()

  async function isAdmin(): Promise<boolean> {
    const { data: { session } } = await sb().auth.getSession()
    if (!session) return false
    const { data } = await sb().from('administrator_profiles').select('user_id').eq('user_id', session.user.id).maybeSingle()
    return !!data
  }

  async function signIn(email: string, password: string): Promise<{ error?: string, retryAt?: number }> {
    const gate = checkThrottle(localStorage)
    if (gate.blocked) return { error: 'Too many failed attempts.', retryAt: gate.retryAt }

    const { error } = await sb().auth.signInWithPassword({ email, password })
    if (error) {
      recordFailure(localStorage)
      const after = checkThrottle(localStorage)
      return { error: 'Invalid email or password.', retryAt: after.retryAt }
    }
    if (!(await isAdmin())) {
      await sb().auth.signOut()
      return { error: 'This account is not approved for administration.' }
    }
    resetThrottle(localStorage)
    wasSignedIn = true
    return {}
  }

  async function signOut() {
    wasSignedIn = false
    await sb().auth.signOut()
  }

  // Middleware helper: true when someone had a session this visit and lost it.
  async function check(): Promise<{ ok: boolean, ended: boolean }> {
    const ok = await isAdmin()
    const ended = !ok && wasSignedIn
    wasSignedIn = ok
    return { ok, ended }
  }

  return { signIn, signOut, check, isAdmin }
}

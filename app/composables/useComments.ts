import type { Comment, CommenterProfile } from '~/types'
import { refusalMessage, validateComment, validateDisplayName } from '~/utils/comments'
import { useSupabase } from '~/composables/useSupabase'

export type ReaderState = { status: 'signed-out' } | { status: 'unconfirmed', email: string } | { status: 'verified', userId: string }

export async function countApproved(articleId: string): Promise<number | null> {
  try {
    const sb = await useSupabase()
    const { count, error } = await sb.from('comments').select('id', { count: 'exact', head: true })
      .eq('content_item_id', articleId).eq('status', 'approved')
    return error ? null : count
  } catch {
    return null
  }
}

// Approved comments for everyone, plus the signed-in reader's own pending ones (RLS), oldest first.
export async function listApproved(articleId: string) {
  const sb = await useSupabase()
  const { data, error } = await sb.from('comments').select('id, author_name, body, created_at, status, user_id')
    .eq('content_item_id', articleId).in('status', ['approved', 'pending'])
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Comment[]
}

function stateOf(user: { id: string, email?: string, email_confirmed_at?: string | null, is_anonymous?: boolean } | undefined): ReaderState {
  if (!user || user.is_anonymous) return { status: 'signed-out' }
  return user.email_confirmed_at ? { status: 'verified', userId: user.id } : { status: 'unconfirmed', email: user.email ?? '' }
}

export async function getReader(): Promise<ReaderState> {
  const sb = await useSupabase()
  const { data: { session } } = await sb.auth.getSession()
  return stateOf(session?.user)
}

export async function onReaderChange(cb: (s: ReaderState) => void) {
  const sb = await useSupabase()
  const { data } = sb.auth.onAuthStateChange((_e, session) => cb(stateOf(session?.user)))
  return () => data.subscription.unsubscribe()
}

export async function signInWith(provider: 'google' | 'github', returnUrl: string) {
  const sb = await useSupabase()
  const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: returnUrl } })
  return error ? 'Sign-in failed. Try again.' : null
}

export async function registerWithEmail(email: string, password: string, returnUrl: string, captchaToken: string) {
  const sb = await useSupabase()
  const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: returnUrl, captchaToken } })
  return error ? error.message : null
}

export async function signInWithEmail(email: string, password: string, captchaToken: string) {
  const sb = await useSupabase()
  const { error } = await sb.auth.signInWithPassword({ email, password, options: { captchaToken } })
  return error ? 'Email or password is wrong.' : null
}

export async function signOut() {
  const sb = await useSupabase()
  await sb.auth.signOut()
}

export async function getProfile(userId: string) {
  const sb = await useSupabase()
  const { data, error } = await sb.from('commenter_profiles').select('user_id, display_name, is_blocked').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data as CommenterProfile | null
}

export async function saveDisplayName(userId: string, name: string): Promise<string | null> {
  const v = validateDisplayName(name)
  if (!v.ok) return v.message
  const sb = await useSupabase()
  const { error } = await sb.from('commenter_profiles').upsert({ user_id: userId, display_name: v.value })
  return error ? 'Your name could not be saved. Try again.' : null
}

export async function postComment(articleId: string, userId: string, text: string): Promise<string | null> {
  const v = validateComment(text)
  if (!v.ok) return v.message
  const sb = await useSupabase()
  const { error } = await sb.from('comments').insert({ content_item_id: articleId, user_id: userId, body: v.value, author_name: '' })
  return error ? refusalMessage(error) : null
}

export async function deleteOwn(id: string): Promise<string | null> {
  const sb = await useSupabase()
  const { error } = await sb.from('comments').delete().eq('id', id)
  return error ? 'The comment could not be deleted. Try again.' : null
}

// Cloudflare Turnstile, loaded only when the email form opens.
export async function renderCaptcha(el: HTMLElement, siteKey: string, onToken: (t: string) => void) {
  const w = window as unknown as { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => void } }
  if (!w.turnstile) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('captcha'))
      document.head.appendChild(s)
    })
  }
  w.turnstile!.render(el, { sitekey: siteKey, callback: onToken, 'expired-callback': () => onToken('') })
}

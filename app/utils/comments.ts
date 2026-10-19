export const MAX_COMMENT = 2000
export const MIN_NAME = 2
export const MAX_NAME = 40

export function validateComment(text: string): { ok: true, value: string } | { ok: false, message: string } {
  const value = text.trim()
  if (!value) return { ok: false, message: 'Write a comment first.' }
  if (value.length > MAX_COMMENT) return { ok: false, message: `Comments can be at most ${MAX_COMMENT} characters.` }
  return { ok: true, value }
}

export function validateDisplayName(name: string): { ok: true, value: string } | { ok: false, message: string } {
  const value = name.trim()
  if (value.length < MIN_NAME || value.length > MAX_NAME) return { ok: false, message: `Use ${MIN_NAME}-${MAX_NAME} characters for your name.` }
  return { ok: true, value }
}

// Maps database errors to the messages in the contract.
export function refusalMessage(e: { message?: string, code?: string } | null | undefined): string {
  const msg = e?.message ?? ''
  if (/closed/i.test(msg)) return 'Commenting is closed on this article.'
  if (/blocked/i.test(msg)) return 'You are blocked from commenting.'
  if (/too many/i.test(msg)) return 'Too many comments. Try again shortly.'
  if (/display name/i.test(msg)) return 'Choose a display name before commenting.'
  if (e?.code === '23514' || /comments_body_len|check constraint/i.test(msg)) return 'The comment is empty or too long.'
  if (e?.code === '42501') return 'Commenting is not available right now. Confirm your email or sign in again.'
  return 'Your comment could not be sent. Try again.'
}

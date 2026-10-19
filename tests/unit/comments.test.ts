import { describe, expect, it } from 'vitest'
import { refusalMessage, validateComment, validateDisplayName } from '~/utils/comments'

describe('comments utils', () => {
  it('validates comment length boundaries', () => {
    expect(validateComment('').ok).toBe(false)
    expect(validateComment('   ').ok).toBe(false)
    expect(validateComment('a').ok).toBe(true)
    expect(validateComment('a'.repeat(2000)).ok).toBe(true)
    expect(validateComment('a'.repeat(2001)).ok).toBe(false)
    expect(validateComment('  hi  ')).toEqual({ ok: true, value: 'hi' })
  })
  it('validates display name boundaries', () => {
    for (const [n, ok] of [['a', false], ['ab', true], ['a'.repeat(40), true], ['a'.repeat(41), false], ['  ', false]] as const) {
      expect(validateDisplayName(n).ok).toBe(ok)
    }
  })
  it('maps every refusal', () => {
    expect(refusalMessage({ message: 'Commenting is closed on this article.' })).toMatch(/closed/)
    expect(refusalMessage({ message: 'You are blocked from commenting.' })).toMatch(/blocked/)
    expect(refusalMessage({ message: 'Too many comments. Try again shortly.' })).toMatch(/Too many/)
    expect(refusalMessage({ message: 'Choose a display name before commenting.' })).toMatch(/display name/)
    expect(refusalMessage({ code: '23514', message: 'x' })).toMatch(/empty or too long/)
    expect(refusalMessage({ code: '42501', message: 'x' })).toMatch(/not available/)
    expect(refusalMessage(null)).toMatch(/could not be sent/)
  })
})

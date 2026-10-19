import { describe, expect, it } from 'vitest'
import { buildSearchQuery, normaliseTag, normaliseTags, parseSearchQuery } from '~/utils/tags'

describe('tags', () => {
  it('folds case and spaces', () => {
    expect(normaliseTag('  Vue   JS ')).toBe('vue js')
  })
  it('rejects empty, commas and over-long tags', () => {
    expect(normaliseTag('   ')).toBeNull()
    expect(normaliseTag('a,b')).toBeNull()
    expect(normaliseTag('x'.repeat(31))).toBeNull()
    expect(normaliseTag('x'.repeat(30))).toBe('x'.repeat(30))
  })
  it('de-duplicates, sorts and caps at 20', () => {
    expect(normaliseTags(['B', 'a', 'b'])).toEqual(['a', 'b'])
    const many = Array.from({ length: 25 }, (_, i) => `t${String(i).padStart(2, '0')}`)
    expect(normaliseTags(many)).toHaveLength(20)
  })
  it('round-trips the query string with repeated tag params', () => {
    const built = buildSearchQuery({ q: ' hello ', tags: ['a', 'b'] })
    expect(built).toEqual({ q: 'hello', tag: ['a', 'b'] })
    expect(parseSearchQuery(built)).toEqual({ q: 'hello', tags: ['a', 'b'] })
    expect(parseSearchQuery({ tag: 'Solo' })).toEqual({ q: '', tags: ['solo'] })
    expect(buildSearchQuery({})).toEqual({})
  })
})

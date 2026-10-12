import { describe, expect, it } from 'vitest'
import { EXCERPT_MAX, isValidSlug, makeExcerpt, slugify, suggestFreeSlug } from '../../app/utils/excerpt'

describe('slugs', () => {
  it('derives a valid address from a title', () => {
    expect(slugify('  Hello, World! Café #1  ')).toBe('hello-world-cafe-1')
    expect(isValidSlug(slugify('Hello, World! Café #1'))).toBe(true)
    expect(slugify('!!!')).toBe('')
  })

  it('validates the address pattern', () => {
    for (const bad of ['', 'Hello', 'a--b', '-a', 'a-', 'a b']) expect(isValidSlug(bad)).toBe(false)
    expect(isValidSlug('a-1-b')).toBe(true)
  })

  it('suggests the next free numeric suffix', () => {
    expect(suggestFreeSlug('post', [])).toBe('post')
    expect(suggestFreeSlug('post', ['post'])).toBe('post-2')
    expect(suggestFreeSlug('post', ['post', 'post-2', 'post-3'])).toBe('post-4')
  })
})

describe('excerpt', () => {
  it('is plain text without Markdown syntax, images or tokens', () => {
    const md = '# Title\n\nSome **bold** text with a [link](https://e.com) and ![pic](embedded:1) done.'
    expect(makeExcerpt(md)).toBe('Title Some bold text with a link and done.')
  })

  it('never exceeds 280 characters', () => {
    const long = makeExcerpt('word '.repeat(500))
    expect(long.length).toBeLessThanOrEqual(EXCERPT_MAX)
    expect(long.endsWith('…')).toBe(true)
    expect(makeExcerpt('x'.repeat(1000)).length).toBeLessThanOrEqual(EXCERPT_MAX)
  })

  it('returns short text unchanged', () => {
    expect(makeExcerpt('Short.')).toBe('Short.')
  })
})

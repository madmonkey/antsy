import { describe, expect, it } from 'vitest'
import { absoluteUrl, firstImage } from '../../app/utils/share'

describe('firstImage', () => {
  it('finds a markdown image', () => {
    expect(firstImage('text\n![alt](https://x.test/a.png "t")\nmore')).toBe('https://x.test/a.png')
  })
  it('finds an html image', () => {
    expect(firstImage('<p><img class="a" src=\'/b.jpg\'></p>')).toBe('/b.jpg')
  })
  it('returns the earliest of the two', () => {
    expect(firstImage('<img src="/h.png"> ![m](/m.png)')).toBe('/h.png')
  })
  it('skips inline data: images', () => {
    expect(firstImage('![a](data:image/png;base64,AAAA) ![b](https://x.test/b.png)')).toBe('https://x.test/b.png')
    expect(firstImage('<img src="data:image/jpeg;base64,AAAA">')).toBeNull()
  })
  it('returns null without images', () => {
    expect(firstImage('just text')).toBeNull()
  })
})

describe('absoluteUrl', () => {
  const base = 'https://o.github.io/antsy/'
  it('keeps absolute urls', () => expect(absoluteUrl('https://x.test/a.png', base)).toBe('https://x.test/a.png'))
  it('adds https to protocol-relative urls', () => expect(absoluteUrl('//x.test/a.png', base)).toBe('https://x.test/a.png'))
  it('resolves paths against the base', () => {
    expect(absoluteUrl('/avatar.webp', base)).toBe('https://o.github.io/antsy/avatar.webp')
    expect(absoluteUrl('img/a.png', base)).toBe('https://o.github.io/antsy/img/a.png')
  })
})

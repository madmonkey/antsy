import { describe, expect, it } from 'vitest'
import { countPath, scriptFor, shouldCount, shouldLoad } from '~/utils/analytics'

const ok = { dev: false, provider: 'umami', id: 'x', doNotTrack: null }

describe('analytics', () => {
  it('loads only in production with a provider, id and no Do Not Track', () => {
    expect(shouldLoad(ok)).toBe(true)
    expect(shouldLoad({ ...ok, dev: true })).toBe(false)
    expect(shouldLoad({ ...ok, id: '' })).toBe(false)
    expect(shouldLoad({ ...ok, provider: '' })).toBe(false)
    expect(shouldLoad({ ...ok, provider: 'other' })).toBe(false)
    expect(shouldLoad({ ...ok, doNotTrack: '1' })).toBe(false)
  })
  it('strips query, hash and base', () => {
    expect(countPath('/antsy/search?q=x', '/antsy/')).toBe('/search')
    expect(countPath('/antsy/', '/antsy/')).toBe('/')
    expect(countPath('/articles/a#top', '/')).toBe('/articles/a')
  })
  it('skips admin and repeats', () => {
    expect(shouldCount('/admin', null)).toBe(false)
    expect(shouldCount('/admin/articles/1', null)).toBe(false)
    expect(shouldCount('/administrivia', null)).toBe(true)
    expect(shouldCount('/a', '/a')).toBe(false)
    expect(shouldCount('/a', '/b')).toBe(true)
  })
  it('builds provider scripts', () => {
    expect(scriptFor('umami', 'abc', '').src).toBe('https://cloud.umami.is/script.js')
    expect(scriptFor('umami', 'abc', 'https://u.example/').attrs['data-auto-track']).toBe('false')
    expect(scriptFor('goatcounter', 'me', '').src).toBe('https://me.goatcounter.com/count.js')
  })
})

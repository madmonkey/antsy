import { beforeEach, describe, expect, it } from 'vitest'
import { checkThrottle, recordFailure, resetThrottle } from '../../app/utils/throttle'

const makeStorage = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}
const MIN = 60_000

describe('sign-in throttle', () => {
  let s: ReturnType<typeof makeStorage>
  beforeEach(() => { s = makeStorage() })

  it('allows two failures and blocks on the third for 15 minutes', () => {
    recordFailure(s, 0)
    recordFailure(s, 0)
    expect(checkThrottle(s, 0).blocked).toBe(false)
    recordFailure(s, 0)
    expect(checkThrottle(s, 1 * MIN)).toEqual({ blocked: true, retryAt: 15 * MIN })
  })

  it('unblocks after 15 minutes and starts counting again', () => {
    for (let i = 0; i < 3; i++) recordFailure(s, 0)
    expect(checkThrottle(s, 15 * MIN).blocked).toBe(false)
    recordFailure(s, 15 * MIN)
    expect(checkThrottle(s, 15 * MIN).blocked).toBe(false)
  })

  it('resets on success', () => {
    recordFailure(s, 0)
    recordFailure(s, 0)
    resetThrottle(s)
    recordFailure(s, 0)
    expect(checkThrottle(s, 0).blocked).toBe(false)
  })

  it('survives a reload because state lives in storage', () => {
    for (let i = 0; i < 3; i++) recordFailure(s, 0)
    expect(checkThrottle(s, 5 * MIN).blocked).toBe(true)
  })

  it('ignores corrupt stored state', () => {
    s.setItem('admin-signin-throttle', '{not json')
    expect(checkThrottle(s, 0).blocked).toBe(false)
  })
})

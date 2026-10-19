export type AnalyticsProvider = 'goatcounter' | 'umami'

export function shouldLoad({ dev, provider, id, doNotTrack }: { dev: boolean, provider: string, id: string, doNotTrack: string | null | undefined }) {
  return !dev && (provider === 'goatcounter' || provider === 'umami') && !!id && doNotTrack !== '1'
}

// Drops the query, hash and site base path so search text never reaches the provider.
export function countPath(fullPath: string, base = '/') {
  let p = fullPath.split('#')[0]!.split('?')[0]!
  const b = base.replace(/\/$/, '')
  if (b && (p === b || p.startsWith(`${b}/`))) p = p.slice(b.length)
  return p.startsWith('/') ? p : `/${p}`
}

export function shouldCount(path: string, lastPath: string | null) {
  return path !== '/admin' && !path.startsWith('/admin/') && path !== lastPath
}

export function scriptFor(provider: AnalyticsProvider, id: string, host: string) {
  const h = host.replace(/\/$/, '')
  if (provider === 'umami') {
    return { src: `${h || 'https://cloud.umami.is'}/script.js`, attrs: { 'data-website-id': id, 'data-auto-track': 'false' } }
  }
  const origin = h || `https://${id}.goatcounter.com`
  return { src: `${origin}/count.js`, attrs: { 'data-goatcounter': `${origin}/count`, 'data-goatcounter-settings': '{"no_onload":true}' } }
}

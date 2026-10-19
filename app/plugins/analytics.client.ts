import { countPath, scriptFor, shouldCount, shouldLoad, type AnalyticsProvider } from '~/utils/analytics'

type Win = Window & {
  goatcounter?: { count: (o: { path: string }) => void }
  umami?: { track: (fn: (p: Record<string, unknown>) => Record<string, unknown>) => void }
}

export default defineNuxtPlugin((nuxt) => {
  const config = useRuntimeConfig()
  const cfg = config.public
  const provider = String(cfg.analyticsProvider || '').toLowerCase()
  const id = String(cfg.analyticsId || '')
  if (!shouldLoad({ dev: import.meta.dev, provider, id, doNotTrack: navigator.doNotTrack })) return

  const base = config.app.baseURL
  const router = useRouter()
  let last: string | null = null
  let ready = false

  function count(fullPath: string) {
    const path = countPath(fullPath, base)
    if (!ready || !shouldCount(path, last)) return
    last = path
    // shortcut: failures are swallowed on purpose so analytics can never break reading
    try {
      const w = window as Win
      if (provider === 'umami') w.umami?.track(p => ({ ...p, url: path }))
      else w.goatcounter?.count({ path })
    } catch { /* ignored */ }
  }

  nuxt.hook('app:suspense:resolve', () => {
    const { src, attrs } = scriptFor(provider as AnalyticsProvider, id, String(cfg.analyticsHost || ''))
    const s = document.createElement('script')
    s.async = true
    s.src = src
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v)
    s.onload = () => { ready = true; count(router.currentRoute.value.fullPath) }
    document.head.appendChild(s)
    router.afterEach(to => count(to.fullPath))
  })
})

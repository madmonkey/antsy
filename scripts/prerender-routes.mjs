// Reads active topic and article slugs (no bodies) and writes .data/routes.json for `nuxt generate`.
// Exits non-zero on any read error, rate limit or empty result so a bad build never replaces the published site (FR-023).
import { mkdirSync, writeFileSync } from 'node:fs'

try { process.loadEnvFile('.env') } catch { /* CI provides real environment variables */ }

const url = process.env.NUXT_PUBLIC_SUPABASE_URL
const key = process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// shortcut: PostgREST returns at most 1000 rows per request; fail loudly at the limit, add paging when a site outgrows it.
const LIMIT = 1000

function fail(message) {
  console.error(`prerender-routes: ${message}`)
  process.exit(1)
}

if (!url || !key) fail('NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set')

async function slugs(table) {
  let res
  try {
    res = await fetch(`${url}/rest/v1/${table}?select=slug&order=slug&limit=${LIMIT}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(30_000)
    })
  } catch (e) {
    fail(`could not reach Supabase for ${table}: ${e.message}`)
  }
  if (!res.ok) fail(`reading ${table} failed with HTTP ${res.status}${res.status === 429 ? ' (rate limited)' : ''}`)
  const rows = await res.json()
  if (rows.length >= LIMIT) fail(`${table} reached the ${LIMIT}-row limit; add paging`)
  return rows.map(r => r.slug)
}

const [topics, articles] = [await slugs('topics'), await slugs('content_items')]
if (!topics.length) fail('no active topics found; refusing to publish an empty snapshot')

const routes = ['/', ...topics.map(s => `/topics/${s}`), ...articles.map(s => `/articles/${s}`)]
mkdirSync('.data', { recursive: true })
writeFileSync('.data/routes.json', JSON.stringify(routes, null, 2))
console.log(`prerender-routes: ${routes.length} routes (${topics.length} topics, ${articles.length} articles)`)

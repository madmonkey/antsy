import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

// The library bundle mentions service_role in its own code, so only secret-key values (prefix plus 16+ key characters) are checked.
// Needs the local Supabase stack (seeded) and E2E_SUPABASE_KEY; slow (full static build).
const env = {
  ...process.env,
  NUXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.E2E_SUPABASE_KEY ?? '',
  NUXT_APP_BASE_URL: '/antsy/'
}
const out = '.output/public'
const run = (cmd: string, args: string[], e = env) => spawnSync(cmd, args, { env: e, encoding: 'utf8', shell: true })

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(f => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]))
}
const read = (p: string) => readFileSync(join(out, p), 'utf8')

describe('build output', () => {
  beforeAll(() => {
    expect(run('node', ['scripts/prerender-routes.mjs']).status).toBe(0)
    expect(run('npx', ['nuxt', 'generate']).status).toBe(0)
  }, 600_000)

  it('has a 404 fallback, language, base path, titles and descriptions', () => {
    expect(existsSync(join(out, '404.html'))).toBe(true)
    const home = read('index.html')
    expect(home).toContain('lang="en-US"')
    expect(home).toContain('/antsy/_nuxt/')
    const article = read('articles/hello-world/index.html')
    expect(article).toMatch(/<title>Hello world/)
    expect(article).toMatch(/<meta name="description" content="The first post\."/)
    expect(read('topics/engineering/index.html')).toMatch(/<title>Engineering/)
  })

  it('omits inactive content and contains no secrets', () => {
    expect(existsSync(join(out, 'articles/hidden-draft'))).toBe(false)
    expect(existsSync(join(out, 'topics/drafts'))).toBe(false)
    for (const f of files(out)) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/sb_secret_[A-Za-z0-9_-]{16,}/)
    }
  })
})

describe('route script', () => {
  it('exits non-zero when Supabase is unreachable', () => {
    const r = run('node', ['scripts/prerender-routes.mjs'], { ...env, NUXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:9' })
    expect(r.status).not.toBe(0)
  })
})

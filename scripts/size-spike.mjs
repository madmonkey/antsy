// Size spike (research D6): finds the largest article body the hosted project accepts.
// Usage: SPIKE_EMAIL=... SPIKE_PASSWORD=... node --env-file=.env scripts/size-spike.mjs
import { createClient } from '@supabase/supabase-js'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

const { NUXT_PUBLIC_SUPABASE_URL: url, NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, SPIKE_EMAIL: email, SPIKE_PASSWORD: password } = process.env
if (!url || !key || !email || !password) {
  console.error('Set NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SPIKE_EMAIL, SPIKE_PASSWORD')
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })
const { error: authError } = await sb.auth.signInWithPassword({ email, password })
if (authError) { console.error('Sign-in failed:', authError.message); process.exit(1) }

const suffix = Date.now().toString(36)
const { data: topic, error: topicError } = await sb.from('topics')
  .insert({ name: `size-spike-${suffix}`, slug: `size-spike-${suffix}`, is_active: false }).select('id').single()
if (topicError) { console.error('Topic insert failed:', topicError.message); process.exit(1) }

const MB = 1_000_000
let largestPassing = 0
const sizes = [1, 5, 7]

try {
  for (const mb of sizes) {
    const body = 'x'.repeat(mb * MB)
    const slug = `size-spike-${suffix}-${mb}`
    const started = Date.now()
    const { data, error, status } = await sb.from('content_items')
      .insert({ topic_id: topic.id, title: `Spike ${mb}`, slug, body, is_active: false }).select('id').single()
    if (error) { console.log(`${mb} MB: FAILED status=${status} ${error.message.slice(0, 120)}`); continue }
    const insertMs = Date.now() - started
    const { data: back, error: readError } = await sb.from('content_items').select('body').eq('id', data.id).single()
    const ok = !readError && back.body.length === body.length
    console.log(`${mb} MB: insert ${insertMs} ms, read-back ${ok ? 'matches' : 'MISMATCH ' + (readError?.message ?? back.body.length)}`)
    if (ok) largestPassing = mb
  }
} finally {
  await sb.from('topics').delete().eq('id', topic.id) // cascades the test articles
}

const md = ('# Heading\n\nSome *markdown* text with a [link](https://example.com).\n\n').repeat(Math.floor(5 * MB / 70))
const t0 = Date.now()
sanitizeHtml(await marked.parse(md))
console.log(`marked + sanitize-html on ~5 MB of text: ${Date.now() - t0} ms`)
console.log(`Largest passing size: ${largestPassing} MB`)

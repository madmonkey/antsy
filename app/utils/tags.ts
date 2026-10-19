export const MAX_TAGS = 20
export const MAX_TAG_LENGTH = 30
export const MAX_QUERY_LENGTH = 200

export function normaliseTag(s: string): string | null {
  const t = s.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!t || t.length > MAX_TAG_LENGTH || t.includes(',')) return null
  return t
}

export function normaliseTags(list: string[]): string[] {
  const out = new Set<string>()
  for (const s of list) {
    const t = normaliseTag(s)
    if (t) out.add(t)
  }
  return [...out].sort().slice(0, MAX_TAGS)
}

type Param = string | string[] | null | undefined | (string | null)[]

function all(v: Param): string[] {
  return (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === 'string')
}

export function parseSearchQuery(query: Record<string, Param>) {
  const q = (all(query.q)[0] ?? '').trim().slice(0, MAX_QUERY_LENGTH)
  return { q, tags: normaliseTags(all(query.tag)) }
}

export function buildSearchQuery({ q, tags }: { q?: string, tags?: string[] }) {
  const query: Record<string, string | string[]> = {}
  const text = (q ?? '').trim().slice(0, MAX_QUERY_LENGTH)
  if (text) query.q = text
  if (tags?.length) query.tag = tags
  return query
}

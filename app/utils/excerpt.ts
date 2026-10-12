const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const isValidSlug = (s: string) => SLUG.test(s)

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// First free `base`, `base-2`, `base-3`, ... given the slugs already in use.
export function suggestFreeSlug(base: string, taken: string[]): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`
}

export const EXCERPT_MAX = 280

// Plain-text summary from Markdown (images and `embedded:n` tokens dropped), at most 280 characters.
export function makeExcerpt(markdown: string): string {
  const text = markdown.slice(0, 4000)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= EXCERPT_MAX) return text
  const cut = text.slice(0, EXCERPT_MAX - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 200 ? cut.slice(0, space) : cut).trimEnd()}…`
}

const MD_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi

// Pasted images are often inline data: URIs, which link previews cannot use.
export function firstImage(body: string): string | null {
  const hits = [...body.matchAll(MD_IMAGE), ...body.matchAll(HTML_IMAGE)]
    .filter(m => !/^data:/i.test(m[1]!))
    .sort((a, b) => a.index - b.index)
  return hits[0]?.[1] ?? null
}

// Link previews need absolute URLs. `base` is the site origin plus the app base path.
export function absoluteUrl(url: string, base: string): string {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  const b = base.replace(/\/$/, '')
  return `${b}/${url.replace(/^\//, '')}`
}

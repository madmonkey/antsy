const MD_IMAGE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/
const HTML_IMAGE = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i

export function firstImage(body: string): string | null {
  const md = MD_IMAGE.exec(body)
  const html = HTML_IMAGE.exec(body)
  const hit = [md, html].filter(Boolean).sort((a, b) => a!.index - b!.index)[0]
  return hit?.[1] ?? null
}

// Link previews need absolute URLs. `base` is the site origin plus the app base path.
export function absoluteUrl(url: string, base: string): string {
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`
  const b = base.replace(/\/$/, '')
  return `${b}/${url.replace(/^\//, '')}`
}

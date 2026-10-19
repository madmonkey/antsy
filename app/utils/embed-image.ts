export const MAX_IMAGE_BYTES = 1_000_000
export const MAX_TOTAL_BYTES = 5_000_000
export const ALLOWED_TYPES_TEXT = 'PNG, JPEG, GIF or WebP'

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

export interface EmbeddedImage {
  id: number
  dataUri: string
  bytes: number
  // Set once the image lives in Supabase Storage; `store` is the admin's choice to keep it there.
  url?: string
  store?: boolean
}

const ascii = (b: Uint8Array, from: number, text: string) => [...text].every((c, i) => b[from + i] === c.charCodeAt(0))

// Content decides the type, never the file name or declared type.
export function sniffImageType(b: Uint8Array): ImageMime | null {
  if (b.length >= 8 && [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].every((v, i) => b[i] === v)) return 'image/png'
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg'
  if (b.length >= 6 && (ascii(b, 0, 'GIF87a') || ascii(b, 0, 'GIF89a'))) return 'image/gif'
  if (b.length >= 12 && ascii(b, 0, 'RIFF') && ascii(b, 8, 'WEBP')) return 'image/webp'
  return null
}

export function checkImage(b: Uint8Array, usedBytes: number): { ok: true, mime: ImageMime } | { ok: false, message: string } {
  const mime = sniffImageType(b)
  if (!mime) return { ok: false, message: `Only ${ALLOWED_TYPES_TEXT} images can be embedded.` }
  if (b.length > MAX_IMAGE_BYTES) return { ok: false, message: `This image is too large. Each image can be at most ${MAX_IMAGE_BYTES / 1_000_000} MB.` }
  if (usedBytes + b.length > MAX_TOTAL_BYTES) {
    return { ok: false, message: `Adding this image would exceed the ${MAX_TOTAL_BYTES / 1_000_000} MB limit for images in one article.` }
  }
  return { ok: true, mime }
}

export function toDataUri(b: Uint8Array, mime: ImageMime): string {
  let binary = ''
  for (let i = 0; i < b.length; i += 0x8000) binary += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return `data:${mime};base64,${btoa(binary)}`
}

const DATA_IMAGE_MD = /!\[([^\]]*)\]\((data:image\/(?:png|jpeg|gif|webp);base64,([A-Za-z0-9+/=]+))\)/g

const rawBytes = (base64: string) => Math.floor(base64.length * 3 / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)

const IMAGE_MD = new RegExp(
  `${DATA_IMAGE_MD.source}|!\\[([^\\]]*)\\]\\((https?://[^)\\s]*/storage/v1/object/public/article-images/[^)\\s]+)\\)`,
  'g'
)

// On load: swap stored data URIs and storage links for short `embedded:n` tokens so the text area stays readable.
export function collapseImages(body: string): { body: string, images: EmbeddedImage[] } {
  const images: EmbeddedImage[] = []
  const collapsed = body.replace(IMAGE_MD, (_m, alt: string, dataUri: string, b64: string, alt2: string, url: string) => {
    if (url) {
      const known = images.find(i => i.url === url)
      const id = known?.id ?? images.length + 1
      if (!known) images.push({ id, dataUri: url, bytes: 0, url, store: true })
      return `![${alt2}](embedded:${id})`
    }
    const id = images.length + 1
    images.push({ id, dataUri, bytes: rawBytes(b64) })
    return `![${alt}](embedded:${id})`
  })
  return { body: collapsed, images }
}

// On save: expand tokens back to the editor's own validated data URIs. Unknown tokens are left (and render nothing).
export function expandImages(body: string, images: EmbeddedImage[]): string {
  return body.replace(/\]\(embedded:(\d+)\)/g, (m, n: string) => {
    const img = images.find(i => i.id === Number(n))
    return img ? `](${img.url ?? img.dataUri})` : m
  })
}

export const totalBytes = (images: EmbeddedImage[]) => images.reduce((sum, i) => sum + i.bytes, 0)

export function nextImageId(images: EmbeddedImage[]) {
  return images.reduce((max, i) => Math.max(max, i.id), 0) + 1
}

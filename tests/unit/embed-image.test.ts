import { describe, expect, it } from 'vitest'
import {
  checkImage, collapseImages, expandImages, MAX_IMAGE_BYTES, MAX_TOTAL_BYTES, nextImageId, sniffImageType, toDataUri, totalBytes
} from '../../app/utils/embed-image'
import { renderPreview } from '../../app/utils/markdown'

const png = (extra = 0) => new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...new Array(extra).fill(0)])
const bytes = (s: string) => new Uint8Array([...s].map(c => c.charCodeAt(0)))

describe('image type sniffing', () => {
  it('accepts png, jpeg, gif and webp by content', () => {
    expect(sniffImageType(png())).toBe('image/png')
    expect(sniffImageType(new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]))).toBe('image/jpeg')
    expect(sniffImageType(bytes('GIF89a....'))).toBe('image/gif')
    expect(sniffImageType(bytes('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
  })

  it('rejects SVG and a script renamed .png', () => {
    expect(checkImage(bytes('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 0).ok).toBe(false)
    const r = checkImage(bytes('<script>alert(1)</script>'), 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('PNG, JPEG, GIF or WebP')
  })
})

describe('image size limits (raw bytes)', () => {
  it('allows exactly 1 MB and rejects over it', () => {
    expect(checkImage(png(MAX_IMAGE_BYTES - 8), 0).ok).toBe(true)
    const r = checkImage(png(MAX_IMAGE_BYTES - 7), 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('at most 1 MB')
  })

  it('rejects when the article total would pass 5 MB', () => {
    expect(checkImage(png(100), MAX_TOTAL_BYTES - 108).ok).toBe(true)
    const r = checkImage(png(100), MAX_TOTAL_BYTES - 107)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('5 MB')
  })
})

describe('embedded tokens', () => {
  const uri = toDataUri(png(4), 'image/png')

  it('collapses data URIs to tokens and expands them back unchanged', () => {
    const stored = `Intro\n\n![logo](${uri})\n\nEnd`
    const { body, images } = collapseImages(stored)
    expect(body).toBe('Intro\n\n![logo](embedded:1)\n\nEnd')
    expect(images).toHaveLength(1)
    expect(images[0].bytes).toBe(12)
    expect(totalBytes(images)).toBe(12)
    expect(expandImages(body, images)).toBe(stored)
    expect(nextImageId(images)).toBe(2)
  })

  it('leaves unknown tokens unexpanded and never reads data URIs typed as text', () => {
    expect(expandImages('![x](embedded:9)', [])).toBe('![x](embedded:9)')
  })
})

describe('preview substitution', () => {
  const img = { id: 1, dataUri: toDataUri(png(4), 'image/png') }

  it('renders known tokens as the editor-validated data URI', () => {
    expect(renderPreview('![a](embedded:1)', [img])).toContain(`src="${img.dataUri}"`)
  })

  it('drops unknown tokens and still blocks unsafe images', () => {
    expect(renderPreview('![a](embedded:2)', [img])).not.toContain('src=')
    expect(renderPreview('![a](data:image/svg+xml;base64,PHN2Zz4=)', [img])).not.toContain('src=')
    expect(renderPreview('![a](javascript:alert(1))', [img])).not.toContain('javascript')
  })
})

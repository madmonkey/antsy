import { Marked } from 'marked'
import markedFootnote from 'marked-footnote'
import sanitizeHtml from 'sanitize-html'

const DATA_IMAGE = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/

const marked = new Marked({ gfm: true }).use(markedFootnote())

// Raw HTML in the Markdown is discarded, then the result is sanitized again.
marked.use({ renderer: { html: () => '' } })

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code',
    'em', 'strong', 'del', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'section', 'input'
  ],
  allowedAttributes: {
    a: ['href', 'id', 'rel', 'target', 'data-footnote-ref', 'data-footnote-backref', 'aria-label'],
    img: ['src', 'alt', 'title'],
    code: ['class'],
    li: ['id'],
    sup: ['id'],
    section: ['class', 'data-footnotes'],
    h2: ['id'],
    th: ['align'],
    td: ['align'],
    input: ['type', 'checked', 'disabled']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tag, attribs) => ({
      tagName: 'a',
      attribs: /^https?:/i.test(attribs.href ?? '') ? { ...attribs, rel: 'noopener noreferrer' } : attribs
    })
  },
  exclusiveFilter: (frame) =>
    frame.tag === 'img' && /^data:/i.test(frame.attribs.src ?? '') && !DATA_IMAGE.test(frame.attribs.src ?? '')
}

export function renderMarkdown(markdown: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false }), options)
}

const previewOptions: sanitizeHtml.IOptions = {
  ...options,
  allowedSchemesByTag: { img: ['http', 'https', 'data', 'embedded'] }
}

// Editor preview: sanitize the short text with `embedded:n` tokens, then substitute the editor's own
// validated data URIs, so the large image data never goes through the sanitizer.
export function renderPreview(markdown: string, images: { id: number, dataUri: string }[]): string {
  const html = sanitizeHtml(marked.parse(markdown, { async: false }), previewOptions)
  return html.replace(/src="embedded:(\d+)"/g, (_m, n: string) => {
    const img = images.find(i => i.id === Number(n))
    return img ? `src="${img.dataUri}"` : ''
  })
}

import { Marked, type Tokens, type TokenizerAndRendererExtension } from 'marked'
import markedFootnote from 'marked-footnote'
import sanitizeHtml from 'sanitize-html'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import csharp from 'highlight.js/lib/languages/csharp'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdownLang from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { slugify } from './excerpt'

// shortcut: a fixed list of common languages keeps the bundle small, add one here when a post needs it.
const languages = { bash, csharp, css, diff, javascript, json, markdown: markdownLang, python, sql, typescript, xml, yaml }
for (const [name, def] of Object.entries(languages)) hljs.registerLanguage(name, def)

// shortcut: a small emoji set, extend the map when a shortcode is missing.
const EMOJI: Record<string, string> = {
  smile: '😄', grin: '😁', joy: '😂', wink: '😉', heart: '❤️', thumbsup: '👍', '+1': '👍', thumbsdown: '👎', '-1': '👎',
  tada: '🎉', fire: '🔥', rocket: '🚀', eyes: '👀', thinking: '🤔', cry: '😢', sob: '😭', scream: '😱', angry: '😠',
  clap: '👏', pray: '🙏', muscle: '💪', warning: '⚠️', white_check_mark: '✅', x: '❌', star: '⭐', bug: '🐛',
  bulb: '💡', sparkles: '✨', poop: '💩', skull: '💀', shrug: '🤷', facepalm: '🤦', coffee: '☕', beer: '🍺', pizza: '🍕'
}

const DATA_IMAGE = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/

// Heading ids make in-page links work; the counter keeps repeated headings unique within one render.
let seenIds = new Map<string, number>()
function headingId(text: string): string {
  const base = slugify(text.replace(/<[^>]*>/g, '')) || 'section'
  const n = (seenIds.get(base) ?? 0) + 1
  seenIds.set(base, n)
  return n === 1 ? base : `${base}-${n}`
}

// Definition lists: a term line followed by one or more `: definition` lines.
const deflist: TokenizerAndRendererExtension = {
  name: 'deflist',
  level: 'block',
  start: (src: string) => /^[^\n:][^\n]*\n:[ \t]/m.exec(src)?.index,
  tokenizer(src: string) {
    const block = /^(?:[^\n]+\n(?::[ \t]+[^\n]+(?:\n|$))+\n?)+/.exec(src)
    if (!block) return undefined
    const items = [...block[0].matchAll(/([^\n]+)\n((?::[ \t]+[^\n]+(?:\n|$))+)/g)].map(([, term, defs]) => ({
      term: this.lexer.inlineTokens(term!),
      defs: defs!.trim().split('\n').map(d => this.lexer.inlineTokens(d.replace(/^:[ \t]+/, '')))
    }))
    return { type: 'deflist', raw: block[0], items }
  },
  renderer(token) {
    const items = token.items as { term: Tokens.Generic[], defs: Tokens.Generic[][] }[]
    return `<dl>${items.map(i =>
      `<dt>${this.parser.parseInline(i.term)}</dt>${i.defs.map(d => `<dd>${this.parser.parseInline(d)}</dd>`).join('')}`
    ).join('')}</dl>\n`
  }
}

const marked = new Marked({ gfm: true, breaks: true })
  .use(markedFootnote())
  .use({ extensions: [deflist] })

marked.use({
  renderer: {
    // Raw HTML in the Markdown is discarded (FR-004), then the result is sanitized again.
    html: () => '',
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens)
      return `<h${depth} id="${headingId(inner)}">${inner}</h${depth}>\n`
    },
    code({ text, lang }) {
      const name = /^[\w-]+$/.exec(lang ?? '')?.[0]
      if (!name) return false
      try {
        return `<pre><code class="language-${name}">${hljs.highlight(text, { language: name, ignoreIllegals: true }).value}\n</code></pre>\n`
      } catch {
        return false // unknown language: fall back to the plain block
      }
    }
  },
  walkTokens(token) {
    if (token.type === 'text' && !('tokens' in token && token.tokens)) {
      token.text = token.text.replace(/:([a-z0-9_+-]+):/g, (m: string, name: string) => EMOJI[name] ?? m)
    }
  }
})

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'ul', 'ol', 'li', 'pre', 'code',
    'em', 'strong', 'del', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'section', 'input',
    'span', 'dl', 'dt', 'dd'
  ],
  allowedAttributes: {
    a: ['href', 'id', 'title', 'rel', 'target', 'data-footnote-ref', 'data-footnote-backref', 'aria-label'],
    img: ['src', 'alt', 'title'],
    code: ['class'],
    span: ['class'],
    li: ['id'],
    ol: ['start'],
    sup: ['id'],
    section: ['class', 'data-footnotes'],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    th: ['align'],
    td: ['align'],
    input: ['type', 'checked', 'disabled']
  },
  allowedClasses: { span: ['hljs-*'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
  exclusiveFilter: (frame) =>
    frame.tag === 'img' && /^data:/i.test(frame.attribs.src ?? '') && !DATA_IMAGE.test(frame.attribs.src ?? '')
}

// Site-relative links ("/topics/x") must include the deployed base path, e.g. "/antsy/" on a project page.
function withBase(base: string, extra: Partial<sanitizeHtml.IOptions> = {}): sanitizeHtml.IOptions {
  return {
    ...options,
    ...extra,
    transformTags: {
      a: (_tag, attribs) => {
        const href = attribs.href ?? ''
        if (/^\/(?!\/)/.test(href)) return { tagName: 'a', attribs: { ...attribs, href: base.replace(/\/$/, '') + href } }
        return { tagName: 'a', attribs: /^https?:/i.test(href) ? { ...attribs, rel: 'noopener noreferrer' } : attribs }
      }
    }
  }
}

function parse(markdown: string): string {
  seenIds = new Map()
  return marked.parse(markdown, { async: false })
}

export function renderMarkdown(markdown: string, base = '/'): string {
  return sanitizeHtml(parse(markdown), withBase(base))
}

// Editor preview: sanitize the short text with `embedded:n` tokens, then substitute the editor's own
// validated data URIs, so the large image data never goes through the sanitizer.
export function renderPreview(markdown: string, images: { id: number, dataUri: string }[], base = '/'): string {
  const html = sanitizeHtml(parse(markdown), withBase(base, { allowedSchemesByTag: { img: ['http', 'https', 'data', 'embedded'] } }))
  return html.replace(/src="embedded:(\d+)"/g, (_m, n: string) => {
    const img = images.find(i => i.id === Number(n))
    return img ? `src="${img.dataUri}"` : ''
  })
}

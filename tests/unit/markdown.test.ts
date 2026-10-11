import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../../app/utils/markdown'

const PNG = 'data:image/png;base64,iVBORw0KGgo='

describe('renderMarkdown: safety', () => {
  it('discards raw HTML and scripts', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<div onclick="x()">hi</div>\n\n<iframe src="https://e.com"></iframe>')
    expect(html).not.toMatch(/<script|<iframe|onclick|<div/i)
  })

  it('drops javascript: and data: links', () => {
    const html = renderMarkdown('[a](javascript:alert(1)) [b](data:text/html;base64,PHNjcmlwdD4=) [c](vbscript:x)')
    expect(html).not.toMatch(/javascript:|data:|vbscript:/i)
  })

  it('keeps http, https and mailto links and hardens external ones', () => {
    const html = renderMarkdown('[a](https://example.com) [b](mailto:me@example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('href="mailto:me@example.com"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('rejects svg and html data images and unsafe image urls', () => {
    const html = renderMarkdown('![a](data:image/svg+xml;base64,PHN2Zz4=) ![b](data:text/html;base64,AAAA) ![c](javascript:x) ![d](ftp://e.com/a.png)')
    expect(html).not.toMatch(/<img[^>]*src/i)
  })

  it('allows https images and strict data images', () => {
    const html = renderMarkdown(`![a](https://example.com/a.png) ![b](${PNG})`)
    expect(html).toContain('src="https://example.com/a.png"')
    expect(html).toContain(`src="${PNG}"`)
  })
})

describe('renderMarkdown: formatting', () => {
  it('renders headings, lists, quotes, code and tables', () => {
    const md = '# H1\n\n- a\n- b\n\n> quote\n\n```js\nconst x = 1\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |'
    const html = renderMarkdown(md)
    for (const tag of ['<h1', '<ul', '<li', '<blockquote', '<pre', '<code', '<table', '<th', '<td']) {
      expect(html).toContain(tag)
    }
  })

  it('renders footnotes', () => {
    const html = renderMarkdown('Text[^1]\n\n[^1]: The note.')
    expect(html).toContain('The note.')
    expect(html).toMatch(/href="#footnote-1"|href="#footnote-ref-1"/)
  })
})

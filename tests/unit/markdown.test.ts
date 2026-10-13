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

  it('keeps list start numbers and link titles', () => {
    const html = renderMarkdown('3. three\n4. four\n\n[x](https://a.com "Tip")')
    expect(html).toContain('<ol start="3">')
    expect(html).toContain('title="Tip"')
  })

  it('gives headings unique ids so in-page links work', () => {
    const html = renderMarkdown('## Same\n\n## Same\n\n### Other *one*')
    expect(html).toContain('<h2 id="same">')
    expect(html).toContain('<h2 id="same-2">')
    expect(html).toContain('<h3 id="other-one">')
  })

  it('prefixes site-relative links with the base path but not external ones', () => {
    const html = renderMarkdown('[a](/topics/x) [b](//evil.com) [c](#top)', '/antsy/')
    expect(html).toContain('href="/antsy/topics/x"')
    expect(html).not.toContain('href="//evil.com"')
    expect(html).toContain('href="#top"')
  })

  it('allows tel links', () => {
    expect(renderMarkdown('[call](tel:555)')).toContain('href="tel:555"')
  })

  it('breaks lines on single newlines', () => {
    expect(renderMarkdown('a\nb')).toContain('a<br')
  })

  it('converts emoji shortcodes but not inside code', () => {
    const html = renderMarkdown('hi :tada: `:tada:` :nope:')
    expect(html).toContain('🎉')
    expect(html).toContain('<code>:tada:</code>')
    expect(html).toContain(':nope:')
  })

  it('renders definition lists', () => {
    const html = renderMarkdown('Term\n: The *meaning*\n: Another')
    expect(html).toContain('<dt>Term</dt>')
    expect(html).toContain('<dd>The <em>meaning</em></dd>')
    expect(html).toContain('<dd>Another</dd>')
  })

  it('highlights known languages and leaves others plain and safe', () => {
    const js = renderMarkdown('```js\nconst x = "<b>"\n```')
    expect(js).toContain('class="language-js"')
    expect(js).toContain('hljs-keyword')
    expect(js).not.toContain('<b>')
    expect(renderMarkdown('```nonsense\nx\n```')).toContain('<code')
    expect(renderMarkdown('```constructor\nx\n```')).toContain('<pre')
  })
})

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecentArticles from '../../app/components/RecentArticles.vue'

const fetchPreviewArticles = vi.fn()
vi.mock('~/composables/useArticles', () => ({ fetchPreviewArticles: (...a: unknown[]) => fetchPreviewArticles(...a) }))
vi.stubGlobal('useAppConfig', () => ({ site: { recentCount: 3 } }))

const article = (n: number) => ({
  id: String(n), title: `Post ${n}`, slug: `post-${n}`, excerpt: `Excerpt ${n}`,
  published_at: '2026-01-01T00:00:00Z', topic: { name: 'Eng', slug: 'eng' }
})

const render = async (props = {}) => {
  const w = mount(RecentArticles, {
    props,
    global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, USkeleton: true, UButton: { template: '<button><slot />Retry</button>' } } }
  })
  await flushPromises()
  return w
}

describe('RecentArticles', () => {
  beforeEach(() => { fetchPreviewArticles.mockReset() })

  it('asks for the site default count and shows each article as a card with topic, date, title and excerpt', async () => {
    fetchPreviewArticles.mockResolvedValue([article(1), article(2), article(3)])
    const w = await render()
    expect(fetchPreviewArticles).toHaveBeenCalledWith(3)
    const cards = w.findAll('[data-test=article]')
    expect(cards).toHaveLength(3)
    expect(cards[0].text()).toContain('Post 1')
    expect(cards[0].text()).toContain('Eng')
    expect(cards[0].text()).toContain('Excerpt 1')
    expect(cards[0].find('a[href="/articles/post-1"]').exists()).toBe(true)
    expect(cards[0].find('a[href="/topics/eng"]').exists()).toBe(true)
  })

  it('uses the count prop and title when given', async () => {
    fetchPreviewArticles.mockResolvedValue([article(1)])
    const w = await render({ count: 6, title: 'Latest' })
    expect(fetchPreviewArticles).toHaveBeenCalledWith(6)
    expect(w.find('h2').text()).toBe('Latest')
  })

  it('has no topic selector', async () => {
    fetchPreviewArticles.mockResolvedValue([article(1)])
    const w = await render()
    expect(w.find('select').exists()).toBe(false)
  })

  it('shows the empty state', async () => {
    fetchPreviewArticles.mockResolvedValue([])
    expect((await render()).text()).toContain('No articles yet.')
  })

  it('shows an error with Retry, and retry reloads', async () => {
    fetchPreviewArticles.mockRejectedValueOnce(new Error('boom')).mockResolvedValue([article(1)])
    const w = await render()
    expect(w.text()).toContain('boom')
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.findAll('[data-test=article]')).toHaveLength(1)
  })

  it('shows a loading state before data arrives', () => {
    fetchPreviewArticles.mockReturnValue(new Promise(() => {}))
    const w = mount(RecentArticles, { global: { stubs: { NuxtLink: true, USkeleton: true } } })
    expect(w.find('[aria-busy=true]').exists()).toBe(true)
  })
})

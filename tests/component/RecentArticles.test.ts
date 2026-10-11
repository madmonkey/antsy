import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecentArticles from '../../app/components/RecentArticles.vue'

const fetchPreviewArticles = vi.fn()
const fetchPreviewableTopics = vi.fn()
vi.mock('~/composables/useArticles', () => ({ fetchPreviewArticles: (...a: unknown[]) => fetchPreviewArticles(...a) }))
vi.mock('~/composables/useTopics', () => ({ fetchPreviewableTopics: () => fetchPreviewableTopics() }))

const article = (n: number) => ({
  id: String(n), title: `Post ${n}`, slug: `post-${n}`, excerpt: `Excerpt ${n}`,
  published_at: '2026-01-01T00:00:00Z', topic: { name: 'Eng', slug: 'eng' }
})

const render = async () => {
  const w = mount(RecentArticles, {
    global: { stubs: { NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' }, USkeleton: true, UButton: { template: '<button><slot />Retry</button>' } } }
  })
  await flushPromises()
  return w
}

describe('RecentArticles', () => {
  beforeEach(() => {
    fetchPreviewArticles.mockReset()
    fetchPreviewableTopics.mockReset()
  })

  it('shows what the query returns (the query itself caps at 3)', async () => {
    fetchPreviewableTopics.mockResolvedValue([])
    fetchPreviewArticles.mockResolvedValue([article(1), article(2), article(3)])
    const w = await render()
    expect(w.findAll('[data-test=article]')).toHaveLength(3)
    expect(fetchPreviewArticles).toHaveBeenCalledWith(undefined)
  })

  it('filter lists only the previewable topics and re-queries on select and clear', async () => {
    fetchPreviewableTopics.mockResolvedValue([{ name: 'Eng', slug: 'eng' }])
    fetchPreviewArticles.mockResolvedValue([article(1)])
    const w = await render()
    expect(w.findAll('option').map(o => o.text())).toEqual(['All topics', 'Eng'])
    await w.find('[data-test=filter]').setValue('eng')
    await flushPromises()
    expect(fetchPreviewArticles).toHaveBeenLastCalledWith('eng')
    await w.find('[data-test=clear]').trigger('click')
    await flushPromises()
    expect(fetchPreviewArticles).toHaveBeenLastCalledWith(undefined)
  })

  it('shows the empty state', async () => {
    fetchPreviewableTopics.mockResolvedValue([])
    fetchPreviewArticles.mockResolvedValue([])
    expect((await render()).text()).toContain('No articles yet.')
  })

  it('shows an error with Retry, and retry reloads', async () => {
    fetchPreviewableTopics.mockResolvedValue([])
    fetchPreviewArticles.mockRejectedValueOnce(new Error('boom')).mockResolvedValue([article(1)])
    const w = await render()
    expect(w.text()).toContain('boom')
    await w.find('button').trigger('click')
    await flushPromises()
    expect(w.findAll('[data-test=article]')).toHaveLength(1)
  })

  it('shows a loading state before data arrives', () => {
    fetchPreviewableTopics.mockReturnValue(new Promise(() => {}))
    fetchPreviewArticles.mockReturnValue(new Promise(() => {}))
    const w = mount(RecentArticles, { global: { stubs: { NuxtLink: true, USkeleton: true } } })
    expect(w.find('[aria-busy=true]').exists()).toBe(true)
  })
})

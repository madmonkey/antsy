import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchArticleBySlug, fetchPreviewArticles, fetchTopicArticles } from '../../app/composables/useArticles'
import { fetchTopicBySlug, fetchTopics } from '../../app/composables/useTopics'

const { useSupabaseMock } = vi.hoisted(() => ({ useSupabaseMock: vi.fn() }))
vi.mock('~/composables/useSupabase', () => ({ useSupabase: useSupabaseMock }))

type QueryResult = { data: unknown[] | null, error: null }
interface Query extends PromiseLike<QueryResult> {
  select(...args: unknown[]): Query
  eq(...args: unknown[]): Query
  not(...args: unknown[]): Query
  order(...args: unknown[]): Query
  limit(...args: unknown[]): Query
  maybeSingle(): Promise<{ data: null, error: null }>
}

const calls: { table: string, method: string, args: unknown[] }[] = []

function queryFor(table: string) {
  const result = Promise.resolve({ data: [], error: null })
  const query: Query = {
    select: (...args) => { calls.push({ table, method: 'select', args }); return query },
    eq: (...args) => { calls.push({ table, method: 'eq', args }); return query },
    not: (...args) => { calls.push({ table, method: 'not', args }); return query },
    order: (...args) => { calls.push({ table, method: 'order', args }); return query },
    limit: (...args) => { calls.push({ table, method: 'limit', args }); return query },
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: result.then.bind(result)
  }
  return query
}

beforeEach(() => {
  calls.length = 0
  useSupabaseMock.mockResolvedValue({ from: (table: string) => queryFor(table) })
})

describe('public content queries', () => {
  it('requires active, published articles from active topics in topic lists', async () => {
    await fetchTopicArticles('topic-id')
    expect(calls.some(call => call.method === 'select' && call.args[0] === 'id, title, slug, excerpt, tags, published_at, topic:topics!inner(is_active)')).toBe(true)
    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['is_active', true] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['topic.is_active', true] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'not', args: ['published_at', 'is', null] })
  })

  it('requires active, published articles from active previewable topics in recent lists', async () => {
    await fetchPreviewArticles(3)
    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['is_active', true] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['topic.is_previewable', true] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['topic.is_active', true] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'not', args: ['published_at', 'is', null] })
  })

  it('does not return an inactive article or one from an inactive topic by slug', async () => {
    await fetchArticleBySlug('draft')

    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['is_active', true] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'not', args: ['published_at', 'is', null] })
    expect(calls).toContainEqual({ table: 'content_items', method: 'eq', args: ['topic.is_active', true] })
  })

  it('counts only published articles for active topics', async () => {
    await fetchTopics()

    expect(calls).toContainEqual({ table: 'topics', method: 'eq', args: ['is_active', true] })
    expect(calls).toContainEqual({ table: 'topics', method: 'eq', args: ['articles.is_active', true] })
    expect(calls).toContainEqual({ table: 'topics', method: 'not', args: ['articles.published_at', 'is', null] })
  })

  it('does not look up inactive topics by slug', async () => {
    await fetchTopicBySlug('topic')

    expect(calls).toContainEqual({ table: 'topics', method: 'eq', args: ['slug', 'topic'] })
    expect(calls).toContainEqual({ table: 'topics', method: 'eq', args: ['is_active', true] })
  })
})

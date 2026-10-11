import type { Article, ArticleSummary, PreviewArticle } from '~/types'
import { useSupabase } from '~/composables/useSupabase'

const PREVIEW_LIMIT = 3

// Lists never select `body`.
export async function fetchTopicArticles(topicId: string) {
  const { data, error } = await useSupabase()
    .from('content_items').select('id, title, slug, excerpt, published_at')
    .eq('topic_id', topicId).order('published_at', { ascending: false })
  if (error) throw error
  return data as ArticleSummary[]
}

export async function fetchArticleBySlug(slug: string) {
  const { data, error } = await useSupabase()
    .from('content_items')
    .select('id, title, slug, excerpt, body, published_at, topic:topics!inner(name, slug)')
    .eq('slug', slug).maybeSingle()
  if (error) throw error
  return data as unknown as (Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'body' | 'published_at'> & { topic: { name: string, slug: string } }) | null
}

export async function fetchPreviewArticles(topicSlug?: string) {
  let query = useSupabase()
    .from('content_items')
    .select('id, title, slug, excerpt, published_at, topic:topics!inner(name, slug, is_previewable)')
    .eq('topics.is_previewable', true)
    .not('published_at', 'is', null)
  if (topicSlug) query = query.eq('topics.slug', topicSlug)
  const { data, error } = await query.order('published_at', { ascending: false }).limit(PREVIEW_LIMIT)
  if (error) throw error
  return data as unknown as PreviewArticle[]
}

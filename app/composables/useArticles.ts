import type { Article, ArticleSummary, PreviewArticle } from '~/types'
import { useSupabase } from '~/composables/useSupabase'

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

export async function fetchPreviewArticles(count: number) {
  const { data, error } = await useSupabase()
    .from('content_items')
    .select('id, title, slug, excerpt, published_at, topic:topics!inner(name, slug, is_previewable)')
    .eq('topics.is_previewable', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(Math.max(1, Math.floor(count)))
  if (error) throw error
  return data as unknown as PreviewArticle[]
}

import type { Article, ArticleSummary, PreviewArticle } from '~/types'
import { useSupabase } from '~/composables/useSupabase'

// Lists never select `body`.
export async function fetchTopicArticles(topicId: string) {
  const sb = await useSupabase()
  const { data, error } = await sb
    .from('content_items').select('id, title, slug, excerpt, tags, published_at, topic:topics!inner(is_active)')
    .eq('topic_id', topicId).eq('is_active', true).eq('topic.is_active', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
  if (error) throw error
  return data as ArticleSummary[]
}

export async function fetchArticleBySlug(slug: string) {
  const sb = await useSupabase()
  const { data, error } = await sb
    .from('content_items')
    .select('id, title, slug, excerpt, body, tags, comments_enabled, published_at, topic:topics!inner(name, slug)')
    .eq('slug', slug).eq('is_active', true).not('published_at', 'is', null)
    .eq('topic.is_active', true).maybeSingle()
  if (error) throw error
  return data as unknown as (Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'body' | 'tags' | 'comments_enabled' | 'published_at'> & { topic: { name: string, slug: string } }) | null
}

export async function fetchPreviewArticles(count: number) {
  const sb = await useSupabase()
  const { data, error } = await sb
    .from('content_items')
    .select('id, title, slug, excerpt, tags, published_at, topic:topics!inner(name, slug, is_previewable)')
    .eq('is_active', true)
    .eq('topic.is_previewable', true)
    .eq('topic.is_active', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(Math.max(1, Math.floor(count)))
  if (error) throw error
  return data as unknown as PreviewArticle[]
}

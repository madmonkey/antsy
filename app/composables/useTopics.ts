import type { Topic } from '~/types'
import { useSupabase } from '~/composables/useSupabase'

export async function fetchTopics() {
  const sb = await useSupabase()
  const { data, error } = await sb
    .from('topics').select('id, name, slug, description, articles:content_items(count)')
    .eq('is_active', true)
    .eq('articles.is_active', true).not('articles.published_at', 'is', null)
    .order('name')
  if (error) throw error
  // The embedded count follows the same read policy as article lists, so inactive articles aren't counted.
  return (data as unknown as (Pick<Topic, 'id' | 'name' | 'slug' | 'description'> & { articles: { count: number }[] })[])
    .map(({ articles, ...topic }) => ({ ...topic, articleCount: articles[0]?.count ?? 0 }))
}

export async function fetchTopicBySlug(slug: string) {
  const sb = await useSupabase()
  const { data, error } = await sb
    .from('topics').select('id, name, slug, description')
    .eq('slug', slug).eq('is_active', true).maybeSingle()
  if (error) throw error
  return data as Pick<Topic, 'id' | 'name' | 'slug' | 'description'> | null
}

import type { SearchResult } from '~/types'
import { useSupabase } from '~/composables/useSupabase'

export async function searchArticles({ q, tags }: { q: string, tags: string[] }) {
  const sb = await useSupabase()
  const { data, error } = await sb.rpc('search_articles', { q: q || null, tag_filter: tags })
  if (error) throw error
  return data as SearchResult[]
}

export async function fetchTags() {
  const sb = await useSupabase()
  const { data, error } = await sb.rpc('list_tags')
  if (error) throw error
  return data as { tag: string, article_count: number }[]
}

import type { Topic } from '~/types'
import { useSupabase } from '~/composables/useSupabase'

export async function fetchTopics() {
  const { data, error } = await useSupabase()
    .from('topics').select('id, name, slug, description').order('name')
  if (error) throw error
  return data as Pick<Topic, 'id' | 'name' | 'slug' | 'description'>[]
}

export async function fetchPreviewableTopics() {
  const { data, error } = await useSupabase()
    .from('topics').select('name, slug').eq('is_previewable', true).order('name')
  if (error) throw error
  return data as Pick<Topic, 'name' | 'slug'>[]
}

export async function fetchTopicBySlug(slug: string) {
  const { data, error } = await useSupabase()
    .from('topics').select('id, name, slug, description').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data as Pick<Topic, 'id' | 'name' | 'slug' | 'description'> | null
}

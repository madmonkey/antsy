import type { PostgrestError } from '@supabase/supabase-js'
import { useSupabase } from '~/composables/useSupabase'
import { suggestFreeSlug } from '~/utils/excerpt'
import type { Article, Topic } from '~/types'

export type AdminTopic = Omit<Topic, 'published_at'> & { published_at: string | null }
export type AdminArticleRow = Pick<Article, 'id' | 'topic_id' | 'title' | 'slug' | 'is_active' | 'published_at'>

export async function getAdminSetting(key: string) {
  const sb = await useSupabase()
  const { data, error } = await sb.from('admin_settings').select('value').eq('key', key).maybeSingle()
  if (error) return null
  return (data?.value as string | undefined) ?? null
}

export async function saveAdminSetting(key: string, value: string) {
  const sb = await useSupabase()
  const { error } = await sb.from('admin_settings').upsert({ key, value })
  return error ? error.message : null
}

export async function listTags() {
  const sb = await useSupabase()
  const { data, error } = await sb.rpc('list_tags')
  if (error) throw error
  return (data as { tag: string }[]).map(r => r.tag)
}

export interface WriteFailure { kind: 'field' | 'session' | 'other', field?: 'name' | 'slug' | 'title' | 'body' | 'tags', message: string }

// Maps database errors onto the error contract: field-level messages, or a lost session.
export async function describeFailure(e: PostgrestError | { message: string, code?: string, status?: number }, table: 'topics' | 'content_items', slug?: string): Promise<WriteFailure> {
  const code = 'code' in e ? e.code : undefined
  const msg = e.message ?? ''
  if (code === '42501' || code === 'PGRST301' || ('status' in e && (e.status === 401 || e.status === 403)) || /jwt/i.test(msg)) {
    return { kind: 'session', message: 'Your session ended. Sign in again; your draft is kept.' }
  }
  if (/at most 20 tags|each tag must/i.test(msg)) {
    return { kind: 'field', field: 'tags', message: msg.replace(/^.*?(At most|Each tag)/, '$1') }
  }
  if (/published addresses are permanent/i.test(msg)) {
    return { kind: 'field', field: 'slug', message: 'Published addresses are permanent and cannot be changed.' }
  }
  if (code === '23505') {
    if (/slug/i.test(msg)) {
      const free = slug ? await freeSlug(slug) : ''
      return { kind: 'field', field: 'slug', message: `That address is already used.${free ? ` Try "${free}".` : ''}` }
    }
    return { kind: 'field', field: 'name', message: 'That name is already used.' }
  }
  if (code === '23514' || code === '23502') {
    if (/body/i.test(msg)) return { kind: 'field', field: 'body', message: 'The article text is empty or too large.' }
    if (/slug/i.test(msg)) return { kind: 'field', field: 'slug', message: 'Use lowercase letters, numbers and single hyphens.' }
    return { kind: 'field', field: table === 'topics' ? 'name' : 'title', message: 'A required value is blank or invalid.' }
  }
  return { kind: 'other', message: 'Saving failed. Your draft is kept; try again.' }
}

async function freeSlug(base: string) {
  const sb = await useSupabase()
  const [a, t] = await Promise.all([
    sb.from('content_items').select('slug').like('slug', `${base}%`),
    sb.from('topics').select('slug').like('slug', `${base}%`)
  ])
  return suggestFreeSlug(base, [...(a.data ?? []), ...(t.data ?? [])].map(r => r.slug))
}

export async function listAdminTopics() {
  const sb = await useSupabase()
  const { data, error } = await sb.from('topics').select('id, name, slug, description, is_active, is_previewable, published_at').order('name')
  if (error) throw error
  return data as AdminTopic[]
}

export async function listAdminArticles() {
  const sb = await useSupabase()
  const { data, error } = await sb.from('content_items').select('id, topic_id, title, slug, is_active, published_at').order('title')
  if (error) throw error
  return data as AdminArticleRow[]
}

export async function getAdminArticle(id: string) {
  const sb = await useSupabase()
  const { data, error } = await sb.from('content_items').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Article | null
}

export async function saveTopic(id: string | null, fields: Pick<Topic, 'name' | 'slug' | 'description' | 'is_active' | 'is_previewable'>) {
  const sb = await useSupabase()
  const q = sb.from('topics')
  const { error } = id ? await q.update(fields).eq('id', id) : await q.insert(fields)
  return error ? describeFailure(error, 'topics', fields.slug) : null
}

export async function deleteTopic(id: string) {
  const sb = await useSupabase()
  const { error } = await sb.from('topics').delete().eq('id', id)
  return error ? describeFailure(error, 'topics') : null
}

export async function saveArticle(id: string | null, fields: Pick<Article, 'topic_id' | 'title' | 'slug' | 'excerpt' | 'body' | 'tags' | 'comments_enabled' | 'cover_image' | 'is_active'>) {
  const sb = await useSupabase()
  const q = sb.from('content_items')
  const { error } = id ? await q.update(fields).eq('id', id) : await q.insert(fields)
  return error ? describeFailure(error, 'content_items', fields.slug) : null
}

// Moves an embedded image into storage and returns its public URL.
export async function uploadArticleImage(dataUri: string): Promise<{ url: string } | { error: string }> {
  const blob = await (await fetch(dataUri)).blob()
  const path = `${crypto.randomUUID()}.${blob.type.split('/')[1]}`
  const sb = await useSupabase()
  const { error } = await sb.storage.from('article-images').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) return { error: 'The cover image could not be uploaded. Try again.' }
  return { url: sb.storage.from('article-images').getPublicUrl(path).data.publicUrl }
}

export async function deleteArticle(id: string) {
  const sb = await useSupabase()
  const { error } = await sb.from('content_items').delete().eq('id', id)
  return error ? describeFailure(error, 'content_items') : null
}

export interface ModerationComment {
  id: string
  user_id: string
  author_name: string
  body: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  article: { title: string, slug: string } | null
}

export async function listCommentsForModeration(status: ModerationComment['status']) {
  const sb = await useSupabase()
  const { data, error } = await sb.from('comments')
    .select('id, user_id, author_name, body, status, created_at, article:content_items(title, slug)')
    .eq('status', status).order('created_at', { ascending: true })
  if (error) throw error
  return data as unknown as ModerationComment[]
}

export async function setCommentStatus(id: string, status: 'approved' | 'rejected') {
  const sb = await useSupabase()
  const { error } = await sb.from('comments').update({ status }).eq('id', id)
  return error ? error.message : null
}

export async function deleteComment(id: string) {
  const sb = await useSupabase()
  const { error } = await sb.from('comments').delete().eq('id', id)
  return error ? error.message : null
}

export async function setCommenterBlocked(userId: string, blocked: boolean) {
  const sb = await useSupabase()
  const { error } = await sb.from('commenter_profiles').update({ is_blocked: blocked }).eq('user_id', userId)
  return error ? error.message : null
}

export async function listBlockedUserIds(userIds: string[]) {
  if (!userIds.length) return new Set<string>()
  const sb = await useSupabase()
  const { data } = await sb.from('commenter_profiles').select('user_id').eq('is_blocked', true).in('user_id', userIds)
  return new Set((data ?? []).map(r => r.user_id as string))
}

export async function countPendingComments() {
  try {
    const sb = await useSupabase()
    const { count, error } = await sb.from('comments').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    return error ? null : count
  } catch {
    return null
  }
}

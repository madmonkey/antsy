<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import {
  deleteArticle, getAdminArticle, listAdminTopics, saveArticle, uploadArticleImage, type AdminTopic, type WriteFailure
} from '~/composables/useAdminContent'
import { collapseImages, expandImages, type EmbeddedImage } from '~/utils/embed-image'
import { isValidSlug, makeExcerpt, slugify } from '~/utils/excerpt'
import { normaliseTag, normaliseTags } from '~/utils/tags'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Article', robots: 'noindex' })

const route = useRoute()
const id = route.params.id === 'new' ? null : String(route.params.id)
const draftKey = `admin-draft:${id ?? 'new'}`

const topics = ref<AdminTopic[]>([])
const form = reactive({ topic_id: '', title: '', slug: '', is_active: false, comments_enabled: true })
const body = ref('')
const tags = ref<string[]>([])
const images = ref<EmbeddedImage[]>([])
const coverId = ref<number | null>(null)
const coverUrl = ref('')
watch(images, (list) => { if (coverId.value !== null && !list.some(i => i.id === coverId.value)) coverId.value = null })
const published = ref(false)
const publishedAt = ref<string | null>(null)
const previewing = ref(false)
const slugTouched = ref(false)
const state = ref<'loading' | 'ready' | 'missing' | 'error'>('loading')
const failure = ref<WriteFailure | null>(null)
const saved = ref(false)

onMounted(async () => {
  try {
    topics.value = await listAdminTopics()
    const draft = sessionStorage.getItem(draftKey)
    if (draft) {
      const d = JSON.parse(draft)
      Object.assign(form, d.form)
      body.value = d.body
      tags.value = d.tags ?? []
      images.value = d.images
      published.value = d.published
      slugTouched.value = true
      sessionStorage.removeItem(draftKey)
    } else if (id) {
      const a = await getAdminArticle(id)
      if (!a) { state.value = 'missing'; return }
      Object.assign(form, { topic_id: a.topic_id, title: a.title, slug: a.slug, is_active: a.is_active, comments_enabled: a.comments_enabled ?? true })
      tags.value = a.tags ?? []
      coverUrl.value = a.cover_image ?? ''
      const c = collapseImages(a.body)
      body.value = c.body
      images.value = c.images
      published.value = !!a.published_at
      publishedAt.value = a.published_at
      slugTouched.value = true
    } else {
      form.topic_id = topics.value[0]?.id ?? ''
    }
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
})

function onTitle() {
  if (!slugTouched.value) form.slug = slugify(form.title)
}

async function fail(f: WriteFailure) {
  failure.value = f
  if (f.kind === 'session') {
    sessionStorage.setItem(draftKey, JSON.stringify({ form, tags: tags.value, body: body.value, images: images.value, published: published.value }))
    await navigateTo('/admin/login?ended=1')
  }
}

async function save() {
  saved.value = false
  failure.value = null
  form.title = form.title.trim()
  if (!form.title) return fail({ kind: 'field', field: 'title', message: 'Enter a title.' })
  if (!isValidSlug(form.slug)) return fail({ kind: 'field', field: 'slug', message: 'Use lowercase letters, numbers and single hyphens.' })
  if (!body.value.trim()) return fail({ kind: 'field', field: 'body', message: 'Enter the article text.' })
  if (!form.topic_id) return fail({ kind: 'other', message: 'Create a topic first.' })
  // shortcut: last write wins, add a version check if concurrent admins appear
  let finalBody = body.value
  let finalImages = images.value
  let cover = coverUrl.value
  const pick = images.value.find(i => i.id === coverId.value)
  if (pick) {
    const up = await uploadArticleImage(pick.dataUri)
    if ('error' in up) return fail({ kind: 'other', message: up.error })
    cover = up.url
    // Swap the embedded copy for the stored file so the article text stays small.
    finalBody = finalBody.replace(new RegExp(`\\]\\(embedded:${pick.id}\\)`, 'g'), `](${up.url})`)
    finalImages = images.value.filter(i => i.id !== pick.id)
  }
  const f = await saveArticle(id, { ...form, tags: normaliseTags(tags.value), excerpt: makeExcerpt(body.value), body: expandImages(finalBody, finalImages), cover_image: cover || null })
  if (f) return fail(f)
  if (pick) {
    body.value = finalBody
    images.value = finalImages
    coverUrl.value = cover
    coverId.value = null
  }
  saved.value = true
  if (!id) await navigateTo('/admin')
}

async function remove() {
  if (!id || !confirm('Delete this article permanently?')) return
  const f = await deleteArticle(id)
  if (f) return fail(f)
  await navigateTo('/admin')
}

const fieldError = (f: string) => (failure.value?.field === f ? failure.value.message : '')
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      {{ id ? 'Edit article' : 'New article' }}
    </h1>
    <p v-if="state === 'loading'">
      Loading…
    </p>
    <p v-else-if="state === 'missing'" role="alert">
      That article does not exist.
    </p>
    <p v-else-if="state === 'error'" role="alert" class="text-error">
      The article could not be loaded. <NuxtLink :to="route.fullPath" class="underline">Retry</NuxtLink>
    </p>
    <form v-else class="space-y-3" data-test="article-form" @submit.prevent="save">
      <label class="block">Topic
        <select v-model="form.topic_id" class="block w-full rounded border border-default p-1" data-test="article-topic">
          <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </label>
      <label class="block">Title
        <input v-model="form.title" class="block w-full rounded border border-default p-1" data-test="article-title" @input="onTitle">
      </label>
      <p v-if="fieldError('title')" role="alert" class="text-error" data-test="error-title">{{ fieldError('title') }}</p>
      <label class="block">Address (slug)
        <input v-model="form.slug" class="block w-full rounded border border-default p-1" data-test="article-slug" @input="slugTouched = true">
      </label>
      <p v-if="published" class="text-sm">Published addresses are permanent.</p>
      <p v-if="fieldError('slug')" role="alert" class="text-error" data-test="error-slug">{{ fieldError('slug') }}</p>
      <label class="block">Tags (press Enter to add, up to 20)
        <UInputTags v-model="tags" class="block w-full" data-test="article-tags" :convert-value="(v: string) => normaliseTag(v) ?? ''" />
      </label>
      <p v-if="fieldError('tags')" role="alert" class="text-error" data-test="error-tags">{{ fieldError('tags') }}</p>
      <MarkdownEditor v-model="body" v-model:images="images" v-model:cover-id="coverId" />
      <p v-if="coverUrl" class="flex items-center gap-2 text-sm" data-test="current-cover">
        <img :src="coverUrl" alt="" class="h-10 w-10 rounded object-cover">
        Cover image (used for link previews)
        <button type="button" class="underline" @click="coverUrl = ''">Remove</button>
      </p>
      <p v-if="fieldError('body')" role="alert" class="text-error" data-test="error-body">{{ fieldError('body') }}</p>
      <label class="flex items-center gap-2"><input v-model="form.is_active" type="checkbox" data-test="article-active"> Active (visible to the public)</label>
      <label class="flex items-center gap-2"><input v-model="form.comments_enabled" type="checkbox" data-test="article-comments"> Allow comments</label>
      <p v-if="failure && !failure.field" role="alert" class="text-error" data-test="error-form">{{ failure.message }}</p>
      <p v-if="saved" role="status" data-test="saved">Saved.</p>
      <div class="flex gap-2">
        <UButton type="submit" label="Save article" data-test="article-save" />
        <UButton label="Preview" variant="outline" data-test="article-preview" @click="previewing = true" />
        <UButton v-if="id" label="Delete" variant="outline" color="error" @click="remove" />
        <NuxtLink to="/admin" class="self-center underline">Back</NuxtLink>
      </div>
    </form>
    <UModal v-model:open="previewing" title="Preview" description="How this article will look when published." :ui="{ content: 'max-w-3xl' }">
      <template #body>
        <ArticleView
          preview
          :title="form.title || 'Untitled'"
          :body="body"
          :images="images"
          :tags="tags"
          :topic="topics.find(t => t.id === form.topic_id) ?? { name: '', slug: '' }"
          :published-at="publishedAt ?? new Date().toISOString()"
        />
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { deleteTopic, listAdminTopics, saveTopic, type AdminTopic, type WriteFailure } from '~/composables/useAdminContent'
import { isValidSlug, slugify } from '~/utils/excerpt'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Topics', robots: 'noindex' })

const topics = ref<AdminTopic[]>([])
const loadError = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', slug: '', description: '', is_active: false, is_previewable: false })
const slugTouched = ref(false)
const published = ref(false)
const failure = ref<WriteFailure | null>(null)
const saved = ref(false)

async function load() {
  loadError.value = false
  try { topics.value = await listAdminTopics() } catch { loadError.value = true }
}
onMounted(load)

function edit(t: AdminTopic | null) {
  editingId.value = t?.id ?? null
  Object.assign(form, t ? { name: t.name, slug: t.slug, description: t.description, is_active: t.is_active, is_previewable: t.is_previewable } : { name: '', slug: '', description: '', is_active: false, is_previewable: false })
  published.value = !!t?.published_at
  slugTouched.value = !!t
  failure.value = null
  saved.value = false
}

function onName() {
  if (!slugTouched.value) form.slug = slugify(form.name)
}

async function handle(f: WriteFailure | null) {
  failure.value = f
  if (f?.kind === 'session') await navigateTo('/admin/login?ended=1')
  return !f
}

async function save() {
  saved.value = false
  form.name = form.name.trim()
  if (!form.name) { failure.value = { kind: 'field', field: 'name', message: 'Enter a name.' }; return }
  if (!isValidSlug(form.slug)) { failure.value = { kind: 'field', field: 'slug', message: 'Use lowercase letters, numbers and single hyphens.' }; return }
  if (await handle(await saveTopic(editingId.value, { ...form }))) {
    edit(null)
    saved.value = true
    await load()
  }
}

async function remove(t: AdminTopic) {
  if (!confirm(`Delete "${t.name}"? All its articles will be permanently deleted.`)) return
  if (await handle(await deleteTopic(t.id))) {
    if (editingId.value === t.id) edit(null)
    await load()
  }
}

const fieldError = (f: string) => (failure.value?.field === f ? failure.value.message : '')
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Topics
    </h1>

    <form class="space-y-3 rounded border border-default p-4" data-test="topic-form" @submit.prevent="save">
      <h2 class="font-semibold">
        {{ editingId ? 'Edit topic' : 'New topic' }}
      </h2>
      <label class="block">Name
        <input v-model="form.name" class="block w-full rounded border border-default p-1" data-test="topic-name" @input="onName">
      </label>
      <p v-if="fieldError('name')" role="alert" class="text-error" data-test="error-name">{{ fieldError('name') }}</p>
      <label class="block">Address (slug)
        <input v-model="form.slug" :disabled="published" class="block w-full rounded border border-default p-1" data-test="topic-slug" @input="slugTouched = true">
      </label>
      <p v-if="published" class="text-sm">Published addresses are permanent.</p>
      <p v-if="fieldError('slug')" role="alert" class="text-error" data-test="error-slug">{{ fieldError('slug') }}</p>
      <label class="block">Description
        <textarea v-model="form.description" rows="2" class="block w-full rounded border border-default p-1" data-test="topic-description" />
      </label>
      <label class="flex items-center gap-2"><input v-model="form.is_active" type="checkbox" data-test="topic-active"> Active (visible to the public)</label>
      <label class="flex items-center gap-2"><input v-model="form.is_previewable" type="checkbox" data-test="topic-previewable"> Show its recent articles on the landing page</label>
      <p v-if="failure && !failure.field" role="alert" class="text-error" data-test="error-form">{{ failure.message }}</p>
      <p v-if="saved" role="status" data-test="saved">Saved.</p>
      <div class="flex gap-2">
        <UButton type="submit" label="Save topic" data-test="topic-save" />
        <UButton v-if="editingId" label="Cancel" variant="outline" @click="edit(null)" />
      </div>
    </form>

    <p v-if="loadError" role="alert" class="text-error">
      Topics could not be loaded. <UButton label="Retry" size="xs" @click="load" />
    </p>
    <ul class="space-y-2">
      <li v-for="t in topics" :key="t.id" class="flex items-center justify-between gap-2 rounded border border-default p-2" data-test="topic-row">
        <span>{{ t.name }} <small>({{ t.is_active ? 'active' : 'inactive' }})</small></span>
        <span class="flex gap-2">
          <UButton label="Edit" size="xs" variant="outline" @click="edit(t)" />
          <UButton label="Delete" size="xs" variant="outline" color="error" @click="remove(t)" />
        </span>
      </li>
    </ul>
  </div>
</template>

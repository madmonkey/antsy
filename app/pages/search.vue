<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchTags, searchArticles } from '~/composables/useSearch'
import type { SearchResult } from '~/types'
import { buildSearchQuery, parseSearchQuery } from '~/utils/tags'

useSeoMeta({ title: 'Search', robots: 'noindex' })

const route = useRoute()
const params = computed(() => parseSearchQuery(route.query))
const text = ref(params.value.q)
const results = ref<SearchResult[]>([])
const allTags = ref<{ tag: string, article_count: number }[]>([])
const status = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
let run = 0

async function load() {
  const { q, tags } = params.value
  const mine = ++run
  status.value = q || tags.length ? 'loading' : 'idle'
  try {
    if (status.value === 'idle') {
      results.value = []
      allTags.value = await fetchTags()
    } else {
      const r = await searchArticles({ q, tags })
      if (mine !== run) return
      results.value = r
      status.value = 'done'
    }
  } catch {
    if (mine === run) status.value = 'error'
  }
}

onNuxtReady(() => {
  load()
  watch(params, () => { text.value = params.value.q; load() })
})

const go = (q: string, tags: string[]) => navigateTo({ path: '/search', query: buildSearchQuery({ q, tags }) })
const submit = () => go(text.value, params.value.tags)
const removeTag = (t: string) => go(params.value.q, params.value.tags.filter(x => x !== t))
const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US') : '')
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      Search
    </h1>
    <form role="search" class="flex gap-2" @submit.prevent="submit">
      <label class="sr-only" for="search-q">Search text</label>
      <input id="search-q" v-model="text" type="search" maxlength="200" class="grow rounded border border-default bg-transparent px-2 py-1">
      <UButton type="submit" label="Search" />
    </form>
    <ul v-if="params.tags.length" class="flex flex-wrap gap-1.5" aria-label="Selected tags">
      <li v-for="t in params.tags" :key="t">
        <button type="button" class="rounded-full border border-default px-2 py-0.5 text-xs hover:bg-elevated" :aria-label="`Remove tag ${t}`" @click="removeTag(t)">
          {{ t }} ×
        </button>
      </li>
    </ul>
    <div aria-live="polite" class="space-y-4">
      <p v-if="status === 'loading'">
        Searching…
      </p>
      <p v-else-if="status === 'error'" role="alert" class="text-error">
        Search is unavailable. <button type="button" class="underline" @click="load">Try again</button>
      </p>
      <template v-else-if="status === 'done'">
        <p v-if="!results.length">
          No results. <NuxtLink to="/search" class="underline">Clear search</NuxtLink>
        </p>
        <ul v-else class="space-y-4">
          <li v-for="r in results" :key="r.id" class="space-y-1">
            <NuxtLink :to="`/articles/${r.slug}`" class="font-medium underline">
              {{ r.title }}
            </NuxtLink>
            <p class="text-sm text-muted">
              {{ r.topic_name }} · {{ formatDate(r.published_at) }}
            </p>
            <p v-if="r.excerpt">
              {{ r.excerpt }}
            </p>
            <TagChips :tags="r.tags" />
          </li>
        </ul>
      </template>
      <div v-else-if="allTags.length">
        <h2 class="mb-2 font-semibold">
          Browse by tag
        </h2>
        <ul class="flex flex-wrap gap-1.5">
          <li v-for="t in allTags" :key="t.tag">
            <NuxtLink :to="`/search?tag=${encodeURIComponent(t.tag)}`" class="rounded-full border border-default px-2 py-0.5 text-xs hover:bg-elevated">
              {{ t.tag }} ({{ t.article_count }})
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

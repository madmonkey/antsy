<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StateMessage from '~/components/StateMessage.vue'
import { fetchPreviewableTopics } from '~/composables/useTopics'
import { fetchPreviewArticles } from '~/composables/useArticles'
import type { PreviewArticle } from '~/types'

const topics = ref<{ name: string, slug: string }[]>([])
const articles = ref<PreviewArticle[]>([])
const selected = ref('')
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [t, a] = await Promise.all([fetchPreviewableTopics(), fetchPreviewArticles(selected.value || undefined)])
    topics.value = t
    articles.value = a
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}

function select(slug: string) {
  selected.value = slug
  return load()
}

onMounted(load)

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US') : '')
</script>

<template>
  <section aria-labelledby="recent-heading" class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h2 id="recent-heading" class="text-xl font-semibold">
        Recent articles
      </h2>
      <div v-if="topics.length" class="flex items-center gap-2">
        <label for="preview-topic" class="sr-only">Filter by topic</label>
        <select
          id="preview-topic"
          data-test="filter"
          :value="selected"
          class="rounded border border-default bg-default p-1"
          @change="select(($event.target as HTMLSelectElement).value)"
        >
          <option value="">
            All topics
          </option>
          <option v-for="t in topics" :key="t.slug" :value="t.slug">
            {{ t.name }}
          </option>
        </select>
        <button v-if="selected" type="button" data-test="clear" class="underline" @click="select('')">
          Clear
        </button>
      </div>
    </div>
    <StateMessage :loading="loading" :error="error" :empty="!articles.length ? 'No articles yet.' : undefined" @retry="load">
      <ul class="space-y-4">
        <li v-for="a in articles" :key="a.id" data-test="article">
          <NuxtLink :to="`/articles/${a.slug}`" class="font-medium underline">
            {{ a.title }}
          </NuxtLink>
          <p class="text-sm text-muted">
            <NuxtLink :to="`/topics/${a.topic.slug}`">
              {{ a.topic.name }}
            </NuxtLink>
            · {{ formatDate(a.published_at) }}
          </p>
          <p v-if="a.excerpt">
            {{ a.excerpt }}
          </p>
        </li>
      </ul>
    </StateMessage>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import StateMessage from '~/components/StateMessage.vue'
import { fetchPreviewArticles } from '~/composables/useArticles'
import type { PreviewArticle } from '~/types'

// Reusable on any page: <RecentArticles /> uses the site default, <RecentArticles :count="6" /> overrides it.
const props = defineProps<{ count?: number, title?: string }>()

const targetCount = computed(() => props.count ?? useAppConfig().site.recentCount)

// Prerender articles via useAsyncData during SSR/prerender to eliminate layout shifts.
// Fallback to client load when useAsyncData is not present (isolated unit test environment).
const hasNuxtAsync = typeof useAsyncData === 'function'

const asyncState = hasNuxtAsync
  ? useAsyncData(
      () => `recent-articles-${targetCount.value}`,
      () => fetchPreviewArticles(targetCount.value)
    )
  : null

const clientArticles = ref<PreviewArticle[]>([])
const clientLoading = ref(true)
const clientError = ref<string | null>(null)

async function load() {
  if (hasNuxtAsync && asyncState) {
    return asyncState.refresh()
  }
  clientLoading.value = true
  clientError.value = null
  try {
    clientArticles.value = await fetchPreviewArticles(targetCount.value)
  } catch (e) {
    clientError.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    clientLoading.value = false
  }
}

if (!hasNuxtAsync) {
  onMounted(load)
} else if (typeof onNuxtReady === 'function') {
  onNuxtReady(() => asyncState?.refresh())
}

const articles = computed(() => (hasNuxtAsync ? asyncState?.data.value ?? [] : clientArticles.value))
const loading = computed(() => (hasNuxtAsync ? asyncState?.status.value === 'pending' && !asyncState?.data.value : clientLoading.value))
const error = computed(() => (hasNuxtAsync ? asyncState?.error.value?.message ?? null : clientError.value))

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US') : '')
</script>

<template>
  <section aria-labelledby="recent-heading" class="space-y-3">
    <h2 id="recent-heading" class="text-xl font-semibold">
      {{ title ?? 'Recent articles' }}
    </h2>
    <StateMessage :loading="loading" :error="error" :empty="!articles.length ? 'No articles yet.' : undefined" @retry="load">
      <ul class="flex flex-wrap gap-4" aria-label="Recent articles">
        <li
          v-for="a in articles"
          :key="a.id"
          data-test="article"
          class="relative flex w-72 max-w-full flex-col gap-2 rounded-lg border border-default p-4 transition hover:bg-elevated"
        >
          <p class="text-sm text-muted">
            <NuxtLink :to="`/topics/${a.topic.slug}`" class="relative z-10 hover:underline">
              {{ a.topic.name }}
            </NuxtLink>
            · {{ formatDate(a.published_at) }}
          </p>
          <h3 class="font-semibold">
            <NuxtLink :to="`/articles/${a.slug}`" class="after:absolute after:inset-0">
              {{ a.title }}
            </NuxtLink>
          </h3>
          <p v-if="a.excerpt" class="text-sm text-muted">
            {{ a.excerpt }}
          </p>
        </li>
      </ul>
    </StateMessage>
  </section>
</template>

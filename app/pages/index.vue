<script setup lang="ts">
import { fetchTopics } from '~/composables/useTopics'

definePageMeta({ wide: true })
useSeoMeta({ title: 'Fuckery Detected', description: 'Articles by Fuckery Detected.' })

const { data: topics, error, status, refresh } = await useAsyncData('topics', fetchTopics)
// Static pages are built ahead of time; re-fetch so visitors see current content (FR-024).
onNuxtReady(() => refresh()) // onMounted fires while hydrating, when refresh() returns the cached payload
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)_16rem]">
    <section aria-labelledby="topics-heading" class="order-2 space-y-3 lg:order-1">
      <h2 id="topics-heading" class="text-xl font-semibold">
        Topics
      </h2>
      <StateMessage
        :loading="status === 'pending' && !topics"
        :error="error?.message"
        :empty="topics && !topics.length ? 'No topics yet.' : undefined"
        @retry="refresh()"
      >
        <ul class="space-y-2">
          <li v-for="t in topics" :key="t.id" class="relative rounded-lg border border-default p-3 transition hover:bg-elevated">
            <div class="flex items-center justify-between gap-2">
              <NuxtLink :to="`/topics/${t.slug}`" class="font-medium after:absolute after:inset-0">
                {{ t.name }}
              </NuxtLink>
              <UBadge :label="String(t.articleCount)" :aria-label="`${t.articleCount} articles`" color="neutral" variant="subtle" />
            </div>
            <p v-if="t.description" class="mt-1 text-sm text-muted">
              {{ t.description }}
            </p>
          </li>
        </ul>
      </StateMessage>
    </section>
    <RecentArticles class="order-1 lg:order-2" />
    <HomeSections class="order-3" />
  </div>
</template>

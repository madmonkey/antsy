<script setup lang="ts">
import { fetchTopics } from '~/composables/useTopics'

useSeoMeta({ title: 'Antsy Tek', description: 'Articles by Antsy Tek.' })

const { data: topics, error, status, refresh } = await useAsyncData('topics', fetchTopics)
// Static pages are built ahead of time; re-fetch so visitors see current content (FR-024).
onMounted(() => refresh())
</script>

<template>
  <div class="space-y-10">
    <RecentArticles />
    <section aria-labelledby="topics-heading" class="space-y-3">
      <h2 id="topics-heading" class="text-xl font-semibold">
        Topics
      </h2>
      <StateMessage
        :loading="status === 'pending' && !topics"
        :error="error?.message"
        :empty="topics && !topics.length ? 'No topics yet.' : undefined"
        @retry="refresh()"
      >
        <ul class="space-y-3">
          <li v-for="t in topics" :key="t.id">
            <NuxtLink :to="`/topics/${t.slug}`" class="font-medium underline">
              {{ t.name }}
            </NuxtLink>
            <p v-if="t.description" class="text-sm text-muted">
              {{ t.description }}
            </p>
          </li>
        </ul>
      </StateMessage>
    </section>
  </div>
</template>

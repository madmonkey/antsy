<script setup lang="ts">
import { fetchTopicBySlug } from '~/composables/useTopics'
import { fetchTopicArticles } from '~/composables/useArticles'

const slug = useRoute().params.slug as string

const { data, error, refresh } = await useAsyncData(`topic-${slug}`, async () => {
  const topic = await fetchTopicBySlug(slug)
  return topic ? { topic, articles: await fetchTopicArticles(topic.id) } : null
})
if (!error.value && !data.value) throw createError({ statusCode: 404, statusMessage: 'Topic not found', fatal: true })
onNuxtReady(() => refresh()) // onMounted fires while hydrating, when refresh() returns the cached payload

useSeoMeta({
  title: () => data.value?.topic.name ?? 'Topic',
  description: () => data.value?.topic.description || `Articles in ${data.value?.topic.name ?? 'this topic'}.`
})

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US') : '')
</script>

<template>
  <div>
  <StateMessage :error="error?.message" @retry="refresh()">
    <div v-if="data" class="space-y-4">
      <h1 class="text-2xl font-bold">
        {{ data.topic.name }}
      </h1>
      <p v-if="data.topic.description">
        {{ data.topic.description }}
      </p>
      <p v-if="!data.articles.length">
        No articles in this topic yet.
      </p>
      <ul class="space-y-4">
        <li v-for="a in data.articles" :key="a.id">
          <NuxtLink :to="`/articles/${a.slug}`" class="font-medium underline">
            {{ a.title }}
          </NuxtLink>
          <p class="text-sm text-muted">
            {{ formatDate(a.published_at) }}
          </p>
          <p v-if="a.excerpt">
            {{ a.excerpt }}
          </p>
        </li>
      </ul>
    </div>
  </StateMessage>
  </div>
</template>

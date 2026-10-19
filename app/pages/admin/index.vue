<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listAdminArticles, listAdminTopics, countPendingComments, type AdminArticleRow, type AdminTopic } from '~/composables/useAdminContent'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Administration', robots: 'noindex' })

const topics = ref<AdminTopic[]>([])
const articles = ref<AdminArticleRow[]>([])
const loading = ref(true)
const failed = ref(false)
const pending = ref<number | null>(null)

async function load() {
  loading.value = true
  failed.value = false
  try {
    [topics.value, articles.value] = await Promise.all([listAdminTopics(), listAdminArticles()])
  } catch {
    failed.value = true
  }
  pending.value = await countPendingComments()
  loading.value = false
}
onMounted(load)

const topicName = computed(() => new Map(topics.value.map(t => [t.id, t.name])))
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Dashboard
    </h1>
    <p v-if="loading">
      Loading…
    </p>
    <p v-else-if="failed" role="alert" class="text-error">
      The lists could not be loaded. <UButton label="Retry" size="xs" @click="load" />
    </p>
    <template v-else>
      <p>
        <NuxtLink to="/admin/comments" class="underline" data-test="manage-comments">
          Comments{{ pending === null ? '' : ` (${pending} awaiting approval)` }}
        </NuxtLink>
      </p>
      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            Topics
          </h2>
          <NuxtLink to="/admin/topics" class="underline" data-test="manage-topics">
            Manage topics
          </NuxtLink>
        </div>
        <ul>
          <li v-for="t in topics" :key="t.id" data-test="topic-item">
            {{ t.name }} <small>({{ t.is_active ? 'active' : 'inactive' }})</small>
          </li>
        </ul>
        <p v-if="!topics.length">
          No topics yet.
        </p>
      </section>
      <section>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            Articles
          </h2>
          <NuxtLink to="/admin/articles/new" class="underline" data-test="new-article">
            New article
          </NuxtLink>
        </div>
        <ul>
          <li v-for="a in articles" :key="a.id" data-test="article-item">
            <NuxtLink :to="`/admin/articles/${a.id}`" class="underline">
              {{ a.title }}
            </NuxtLink>
            <small> — {{ topicName.get(a.topic_id) }}, {{ a.is_active ? 'active' : 'inactive' }}</small>
          </li>
        </ul>
        <p v-if="!articles.length">
          No articles yet.
        </p>
      </section>
    </template>
    <TrafficCard />
  </div>
</template>

<script setup lang="ts">
import { fetchArticleBySlug } from '~/composables/useArticles'

const slug = useRoute().params.slug as string

const { data: article, error, refresh } = await useAsyncData(`article-${slug}`, () => fetchArticleBySlug(slug))
if (!error.value && !article.value) throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
onNuxtReady(() => refresh()) // onMounted fires while hydrating, when refresh() returns the cached payload

useSeoMeta({
  title: () => article.value?.title ?? 'Article',
  description: () => article.value?.excerpt || article.value?.title || ''
})
</script>

<template>
  <div>
  <StateMessage :error="error?.message" @retry="refresh()">
    <ArticleView
      v-if="article"
      :title="article.title"
      :body="article.body"
      :topic="article.topic"
      :published-at="article.published_at"
    />
  </StateMessage>
  </div>
</template>

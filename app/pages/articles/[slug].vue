<script setup lang="ts">
import { fetchArticleBySlug } from '~/composables/useArticles'

const slug = useRoute().params.slug as string

const { data: article, error, refresh } = await useAsyncData(`article-${slug}`, () => fetchArticleBySlug(slug))
if (!error.value && !article.value) throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
onMounted(() => refresh())

useSeoMeta({
  title: () => article.value?.title ?? 'Article',
  description: () => article.value?.excerpt || article.value?.title || ''
})
</script>

<template>
  <StateMessage :error="error?.message" @retry="refresh()">
    <article v-if="article" class="space-y-4">
      <p class="text-sm text-muted">
        <NuxtLink :to="`/topics/${article.topic.slug}`" class="underline">
          {{ article.topic.name }}
        </NuxtLink>
        <template v-if="article.published_at">
          · {{ new Date(article.published_at).toLocaleDateString('en-US') }}
        </template>
      </p>
      <h1 class="text-3xl font-bold">
        {{ article.title }}
      </h1>
      <ArticleBody :markdown="article.body" />
    </article>
  </StateMessage>
</template>

<script setup lang="ts">
import { fetchArticleBySlug } from '~/composables/useArticles'
import { absoluteUrl, firstImage } from '~/utils/share'

const slug = useRoute().params.slug as string

const { data: article, error, refresh } = await useAsyncData(`article-${slug}`, () => fetchArticleBySlug(slug))
if (!error.value && !article.value) throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })
onNuxtReady(() => refresh()) // onMounted fires while hydrating, when refresh() returns the cached payload

const config = useRuntimeConfig()
const siteBase = `${String(config.public.siteUrl).replace(/\/$/, '')}${config.app.baseURL}`
const { site } = useAppConfig()
const shareImage = computed(() => absoluteUrl(article.value?.cover_image || firstImage(article.value?.body ?? '') || '/og-default.png?v=2', siteBase))
const shareDescription = computed(() => article.value?.excerpt || article.value?.title || '')

useSeoMeta({
  title: () => article.value?.title ?? 'Article',
  description: shareDescription,
  ogType: 'article',
  ogSiteName: site.name,
  ogTitle: () => article.value?.title ?? 'Article',
  ogDescription: shareDescription,
  ogImage: shareImage,
  ogUrl: `${siteBase}articles/${slug}/`,
  twitterCard: 'summary_large_image',
  twitterTitle: () => article.value?.title ?? 'Article',
  twitterDescription: shareDescription,
  twitterImage: shareImage
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
      :tags="article.tags"
      :article-id="article.id"
      :comments-enabled="article.comments_enabled"
    />
  </StateMessage>
  </div>
</template>

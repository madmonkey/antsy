<script setup lang="ts">
import type { EmbeddedImage } from '~/utils/embed-image'

// One layout for the public page and the admin preview, so the preview cannot drift from the real page.
defineProps<{
  title: string
  body: string
  topic: { name: string, slug: string }
  publishedAt: string | null
  images?: EmbeddedImage[]
  preview?: boolean
}>()
</script>

<template>
  <article class="space-y-4">
    <p class="text-sm text-muted">
      <span v-if="preview">{{ topic.name }}</span>
      <NuxtLink v-else :to="`/topics/${topic.slug}`" class="underline">
        {{ topic.name }}
      </NuxtLink>
      <template v-if="publishedAt">
        · {{ new Date(publishedAt).toLocaleDateString('en-US') }}
      </template>
    </p>
    <h1 class="text-3xl font-bold">
      {{ title }}
    </h1>
    <ArticleBody :markdown="body" :images="images" />
  </article>
</template>

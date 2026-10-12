<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown, renderPreview } from '~/utils/markdown'
import type { EmbeddedImage } from '~/utils/embed-image'

// `images` is only passed by the editor preview, where `embedded:n` tokens are not yet expanded.
const props = defineProps<{ markdown: string, images?: EmbeddedImage[] }>()
const html = computed(() => (props.images ? renderPreview(props.markdown, props.images) : renderMarkdown(props.markdown)))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitized by renderMarkdown -->
  <div class="article-body" v-html="html" />
</template>

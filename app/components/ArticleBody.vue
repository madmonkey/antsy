<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{ markdown: string }>()
const html = computed(() => renderMarkdown(props.markdown))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitized by renderMarkdown -->
  <div class="article-body" v-html="html" />
</template>

<style scoped>
.article-body :deep(h1) { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
.article-body :deep(h2) { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
.article-body :deep(h3) { font-size: 1.25rem; font-weight: 600; margin: 1.25rem 0 0.5rem; }
.article-body :deep(p),
.article-body :deep(ul),
.article-body :deep(ol),
.article-body :deep(pre),
.article-body :deep(table),
.article-body :deep(blockquote) { margin: 0.75rem 0; }
.article-body :deep(ul) { list-style: disc; padding-left: 1.5rem; }
.article-body :deep(ol) { list-style: decimal; padding-left: 1.5rem; }
.article-body :deep(a) { color: var(--ui-primary); text-decoration: underline; }
.article-body :deep(blockquote) { border-left: 4px solid var(--ui-border); padding-left: 1rem; color: var(--ui-text-muted); }
.article-body :deep(pre) { background: var(--ui-bg-muted); padding: 0.75rem; overflow-x: auto; border-radius: 0.375rem; }
.article-body :deep(code) { font-family: ui-monospace, monospace; font-size: 0.9em; }
.article-body :deep(table) { border-collapse: collapse; }
.article-body :deep(th),
.article-body :deep(td) { border: 1px solid var(--ui-border); padding: 0.25rem 0.75rem; }
.article-body :deep(img) { max-width: 100%; height: auto; }
</style>

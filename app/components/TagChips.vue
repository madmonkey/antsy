<script setup lang="ts">
defineProps<{ tags?: string[] }>()
</script>

<template>
  <ul v-if="tags?.length" class="relative z-10 flex flex-wrap gap-1.5" aria-label="Tags">
    <li v-for="t in tags" :key="t">
      <NuxtLink :to="`/search?tag=${encodeURIComponent(t)}`" class="rounded-full border border-default px-2 py-0.5 text-xs hover:bg-elevated">
        {{ t }}
      </NuxtLink>
    </li>
  </ul>
</template>

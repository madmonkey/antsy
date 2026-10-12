<script setup lang="ts">
defineProps<{ links: { platform: string, label: string, url: string }[] }>()
</script>

<template>
  <ul class="flex items-center gap-1" data-test="social-links">
    <li v-for="l in links" :key="l.platform">
      <a :href="l.url" target="_blank" rel="noopener noreferrer" :aria-label="l.label" class="inline-flex p-2">
        <UIcon :name="`i-simple-icons-${l.platform}`" class="size-5" />
      </a>
    </li>
  </ul>
</template>

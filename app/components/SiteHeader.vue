<script setup lang="ts">
defineProps<{ width?: string }>()
const { site } = useAppConfig()
</script>

<template>
  <header class="border-b border-default">
    <div :class="['mx-auto flex flex-wrap items-center justify-between gap-2 p-4', width ?? 'max-w-3xl']">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
        {{ site.name }}
        <img v-if="site.avatar" :src="site.avatar" alt="" width="32" height="32" class="size-8 rounded-full">
      </NuxtLink>
      <div class="flex items-center gap-1">
        <SocialLinks v-if="site.social.length" :links="site.social" />
        <ThemeToggle />
        <slot />
      </div>
    </div>
  </header>
</template>

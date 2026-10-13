<script setup lang="ts">
import { computed } from 'vue'

defineProps<{ width?: string }>()
const { site } = useAppConfig()

const avatarSrc = computed(() => {
  const avatar = site.avatar
  if (!avatar) return ''
  if (avatar.startsWith('/')) {
    try {
      const runtimeConfig = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : null
      const base = runtimeConfig?.app?.baseURL
      if (base && base !== '/') {
        return `${base.replace(/\/$/, '')}${avatar}`
      }
    } catch {
      // ignore
    }
  }
  return avatar
})
</script>

<template>
  <header class="border-b border-default">
    <div :class="['mx-auto flex flex-wrap items-center justify-between gap-2 p-4', width ?? 'max-w-3xl']">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
        {{ site.name }}
        <img v-if="avatarSrc" :src="avatarSrc" alt="" width="32" height="32" decoding="async" class="size-8 rounded-full">
      </NuxtLink>
      <div class="flex items-center gap-1">
        <SocialLinks v-if="site.social.length" :links="site.social" />
        <ThemeToggle />
        <slot />
      </div>
    </div>
  </header>
</template>

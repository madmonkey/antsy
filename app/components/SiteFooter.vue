<script setup lang="ts">
const { site } = useAppConfig()
</script>

<template>
  <footer class="border-t border-default">
    <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 p-4 text-sm text-muted">
      <span>{{ site.name }}</span>
      <SocialLinks v-if="site.social.length" :links="site.social" />
      <NuxtLink to="/privacy" class="underline">
        Privacy
      </NuxtLink>
    </div>
  </footer>
</template>

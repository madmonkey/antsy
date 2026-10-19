<script setup lang="ts">
const { site } = useAppConfig()
</script>

<template>
  <footer class="border-t border-default">
    <div class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 p-4 text-sm text-muted">
      <span>{{ site.name }}</span>
      <NuxtLink to="/privacy" class="underline">
        Privacy
      </NuxtLink>
    </div>
  </footer>
</template>

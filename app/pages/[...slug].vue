<script setup lang="ts">
useSeoMeta({ title: 'Page not found', robots: 'noindex' })
</script>

<template>
  <div class="space-y-3">
    <h1 class="text-2xl font-bold">
      Page not found
    </h1>
    <p>We couldn't find that page.</p>
    <UButton to="/" label="Back to home" />
  </div>
</template>

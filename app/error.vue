<script setup lang="ts">
defineProps<{ error: { statusCode: number } }>()
useSeoMeta({ title: 'Page not found', robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <div class="space-y-3">
      <h1 class="text-2xl font-bold">
        {{ error.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}
      </h1>
      <p>{{ error.statusCode === 404 ? "We couldn't find that page." : 'Please try again.' }}</p>
      <UButton to="/" label="Back to home" @click="clearError({ redirect: '/' })" />
    </div>
  </NuxtLayout>
</template>

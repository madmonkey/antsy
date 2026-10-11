<script setup lang="ts">
defineProps<{ loading?: boolean, error?: string | null, empty?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div v-if="loading" class="space-y-3" aria-busy="true" aria-live="polite">
    <USkeleton class="h-6 w-2/3" />
    <USkeleton class="h-4 w-full" />
    <USkeleton class="h-4 w-5/6" />
  </div>
  <div v-else-if="error" role="alert" class="space-y-2">
    <p>Something went wrong loading this. {{ error }}</p>
    <UButton label="Retry" @click="$emit('retry')" />
  </div>
  <p v-else-if="empty">
    {{ empty }}
  </p>
  <slot v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const label = computed(() => (isDark.value ? 'Switch to day mode' : 'Switch to night mode'))
const toggle = () => { colorMode.preference = isDark.value ? 'light' : 'dark' }
</script>

<template>
  <UButton
    :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
    :aria-label="label"
    :title="label"
    variant="ghost"
    color="neutral"
    data-test="theme-toggle"
    @click="toggle"
  />
</template>

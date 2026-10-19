<script setup lang="ts">
import { ref } from 'vue'

const q = ref('')

async function go() {
  const text = q.value.trim()
  if (text) await navigateTo({ path: '/search', query: { q: text } })
}
</script>

<template>
  <form role="search" class="flex items-center" @submit.prevent="go">
    <label class="sr-only" for="site-search">Search articles</label>
    <input
      id="site-search"
      v-model="q"
      type="search"
      maxlength="200"
      placeholder="Search"
      class="w-28 rounded border border-default bg-transparent px-2 py-1 text-sm sm:w-40"
    >
  </form>
</template>

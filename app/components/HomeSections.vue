<script setup lang="ts">
// Collapsed by default; sides alternate left, right, left. Text comes from app.config.ts.
const { site } = useAppConfig()
const sections = computed(() => [
  { id: 'privacy', title: 'Privacy', icon: 'i-lucide-venetian-mask', text: site.privacy, link: { to: '/privacy', label: 'Read the full privacy notice' } },
  { id: 'thanks', title: 'Thanks', icon: 'i-lucide-wine', text: site.thanks.text, tip: site.thanks.tipUrl },
  { id: 'about', title: 'About me', icon: 'i-lucide-user', text: site.about }
])
</script>

<template>
  <div class="space-y-3">
    <details
      v-for="(s, i) in sections"
      :key="s.id"
      class="group w-full max-w-md rounded border border-default"
      :class="i % 2 ? 'ml-auto' : 'mr-auto'"
      :data-test="`section-${s.id}`"
    >
      <summary class="flex cursor-pointer list-none items-center gap-2 p-3 font-semibold" :class="i % 2 ? 'flex-row-reverse text-right' : ''">
        <UIcon :name="s.icon" class="size-5 shrink-0" />
        <span class="flex-1">{{ s.title }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div class="space-y-3 px-3 pb-3 text-sm text-muted" :class="i % 2 ? 'text-right' : ''">
        <p class="whitespace-pre-line">
          {{ s.text }}
        </p>
        <NuxtLink v-if="s.link" :to="s.link.to" class="underline">
          {{ s.link.label }}
        </NuxtLink>
        <UButton v-if="s.tip" :to="s.tip" target="_blank" rel="noopener noreferrer" icon="i-lucide-wine" label="Buy me a whiskey" size="sm" />
      </div>
    </details>
  </div>
</template>

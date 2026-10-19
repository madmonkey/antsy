<script setup lang="ts">
useSeoMeta({ title: 'Privacy', description: 'What this site collects about visitors.' })
const provider = String(useRuntimeConfig().public.analyticsProvider || '')
const names: Record<string, string> = { goatcounter: 'GoatCounter', umami: 'Umami' }
const { site } = useAppConfig()
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">
      Privacy
    </h1>
    <p v-if="names[provider.toLowerCase()]">
      This site counts visits with {{ names[provider.toLowerCase()] }}, a privacy-focused analytics service.
    </p>
    <p v-else>
      This site does not currently collect any visit statistics.
    </p>
    <template v-if="names[provider.toLowerCase()]">
      <h2 class="text-xl font-semibold">
        What is counted
      </h2>
      <ul class="list-disc pl-6">
        <li>The page address that was viewed, without any search text.</li>
        <li>The page that referred you, and the type of browser and screen.</li>
        <li>Your country, not your exact location.</li>
      </ul>
      <h2 class="text-xl font-semibold">
        What is not
      </h2>
      <p>No cookies, no stored identifiers, no personal information and no tracking across sites. Because of that, no consent banner is needed. If your browser sends Do Not Track, nothing is counted.</p>
    </template>
    <h2 class="text-xl font-semibold">
      Contact
    </h2>
    <p>
      Questions? Reach out through
      <template v-for="(s, i) in site.social" :key="s.url">
        <a :href="s.url" class="underline" rel="noopener noreferrer">{{ s.label }}</a>{{ i < site.social.length - 1 ? ', ' : '.' }}
      </template>
    </p>
  </div>
</template>

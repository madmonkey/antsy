<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAdminSetting, saveAdminSetting } from '~/composables/useAdminContent'

const KEY = 'analytics_dashboard_url'
const link = String(useRuntimeConfig().public.analyticsDashboard || '')
const shared = ref<string | null>(null)
const draft = ref('')
const message = ref('')

onMounted(async () => {
  shared.value = await getAdminSetting(KEY)
  draft.value = shared.value ?? ''
})

async function save() {
  message.value = ''
  const v = draft.value.trim()
  if (!/^https:\/\//.test(v)) { message.value = 'Enter an address starting with https://'; return }
  const err = await saveAdminSetting(KEY, v)
  if (err) { message.value = 'Could not save. Run the admin_settings migration, then try again.'; return }
  shared.value = v
  message.value = 'Saved.'
}
</script>

<template>
  <section class="space-y-2" aria-labelledby="traffic-heading">
    <h2 id="traffic-heading" class="text-xl font-semibold">
      Traffic
    </h2>
    <p v-if="link">
      <a :href="link" target="_blank" rel="noopener noreferrer" class="underline" data-test="traffic-link">Open the analytics dashboard</a>
    </p>
    <p v-else class="text-sm text-muted">
      No analytics dashboard is configured yet (set NUXT_PUBLIC_ANALYTICS_DASHBOARD).
    </p>
    <template v-if="shared">
      <iframe :src="shared" title="Site traffic" class="h-96 w-full rounded border border-default" referrerpolicy="no-referrer" />
      <p class="text-sm">
        Not showing? Some dashboards refuse embedding. <a :href="shared" target="_blank" rel="noopener noreferrer" class="underline">Open in a new tab</a>.
      </p>
    </template>
    <form class="flex flex-wrap items-end gap-2" @submit.prevent="save">
      <label class="grow">Shared dashboard address (optional, https only)
        <input v-model="draft" class="block w-full rounded border border-default bg-transparent p-1" placeholder="https://…">
      </label>
      <UButton type="submit" label="Save" size="sm" />
    </form>
    <p v-if="message" role="status" class="text-sm">
      {{ message }}
    </p>
  </section>
</template>

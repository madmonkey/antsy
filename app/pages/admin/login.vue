<script setup lang="ts">
useSeoMeta({ title: 'Administration sign-in', robots: 'noindex' })

const route = useRoute()
const session = useAdminSession()
const email = ref('')
const password = ref('')
const error = ref('')
const retryAt = ref<number>()
const busy = ref(false)

const retryTime = computed(() => (retryAt.value ? new Date(retryAt.value).toLocaleTimeString('en-US') : ''))

async function submit() {
  busy.value = true
  error.value = ''
  const result = await session.signIn(email.value.trim(), password.value)
  busy.value = false
  if (result.error) {
    error.value = result.error
    retryAt.value = result.retryAt
    return
  }
  await navigateTo('/admin')
}
</script>

<template>
  <form class="mx-auto max-w-sm space-y-4" @submit.prevent="submit">
    <h1 class="text-2xl font-bold">
      Administration
    </h1>
    <p v-if="route.query.ended" role="status">
      Your session ended. Please sign in again.
    </p>
    <div class="space-y-1">
      <label for="email" class="block">Email</label>
      <input id="email" v-model="email" type="email" autocomplete="username" required class="w-full rounded border border-default bg-default p-2">
    </div>
    <div class="space-y-1">
      <label for="password" class="block">Password</label>
      <input id="password" v-model="password" type="password" autocomplete="current-password" required class="w-full rounded border border-default bg-default p-2">
    </div>
    <p v-if="error" role="alert" data-test="error">
      {{ error }}<template v-if="retryTime"> Try again after {{ retryTime }}.</template>
    </p>
    <UButton type="submit" label="Sign in" :loading="busy" :disabled="busy" />
  </form>
</template>

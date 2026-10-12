<script setup lang="ts">
const session = useAdminSession()

async function signOut() {
  await session.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div>
    <header class="border-b border-default">
      <div class="mx-auto flex max-w-5xl items-center justify-between p-4">
        <NuxtLink to="/admin" class="font-semibold">
          Antsy Tek administration
        </NuxtLink>
        <div class="flex items-center gap-3">
          <NuxtLink to="/" class="underline">
            View site
          </NuxtLink>
          <UColorModeButton />
          <UButton label="Sign out" variant="outline" @click="signOut" />
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-5xl p-6">
      <slot />
    </main>
  </div>
</template>

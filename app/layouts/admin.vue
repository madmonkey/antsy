<script setup lang="ts">
const session = useAdminSession()

async function signOut() {
  await session.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div>
    <SiteHeader width="max-w-5xl">
      <NuxtLink to="/admin" class="px-2 underline">
        Admin
      </NuxtLink>
      <UButton label="Sign out" variant="outline" @click="signOut" />
    </SiteHeader>
    <main class="mx-auto max-w-5xl p-6">
      <slot />
    </main>
  </div>
</template>

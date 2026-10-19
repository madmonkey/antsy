<script setup lang="ts">
const session = useAdminSession()

async function signOut() {
  await session.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div>
    <nav aria-label="Administration" class="sticky top-0 z-10 border-b border-default bg-elevated">
      <div class="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-2 text-sm">
        <NuxtLink to="/admin" class="underline">
          Dashboard
        </NuxtLink>
        <NuxtLink to="/admin/articles/new" class="underline">
          New article
        </NuxtLink>
        <NuxtLink to="/admin/topics" class="underline">
          Topics
        </NuxtLink>
        <NuxtLink to="/admin/comments" class="underline">
          Comments
        </NuxtLink>
        <UButton label="Sign out" size="xs" variant="outline" class="ml-auto" @click="signOut" />
      </div>
    </nav>
    <SiteHeader width="max-w-5xl" />
    <main class="mx-auto max-w-5xl p-6">
      <slot />
    </main>
  </div>
</template>

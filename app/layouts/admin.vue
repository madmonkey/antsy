<script setup lang="ts">
const session = useAdminSession()

async function signOut() {
  await session.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div>
    <nav aria-label="Administration" class="sticky top-0 z-20 border-b border-default bg-elevated">
      <div class="mx-auto flex max-w-5xl items-center gap-1 px-2 py-1">
        <UButton to="/admin" icon="i-lucide-layout-dashboard" variant="ghost" aria-label="Dashboard" title="Dashboard" />
        <UButton to="/admin/articles/new" icon="i-lucide-square-pen" variant="ghost" aria-label="New article" title="New article" />
        <UButton to="/admin/topics" icon="i-lucide-tags" variant="ghost" aria-label="Topics" title="Topics" />
        <UButton to="/admin/comments" icon="i-lucide-message-square" variant="ghost" aria-label="Comments" title="Comments" />
        <UButton icon="i-lucide-power" variant="ghost" color="error" class="ml-auto" aria-label="Sign out" title="Sign out" @click="signOut" />
      </div>
    </nav>
    <SiteHeader width="max-w-5xl" hide-sign-out />
    <main class="mx-auto min-w-0 max-w-5xl p-3 sm:p-6">
      <slot />
    </main>
  </div>
</template>

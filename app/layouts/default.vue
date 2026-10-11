<template>
  <div>
    <header class="border-b border-default">
      <div class="mx-auto flex max-w-3xl items-center justify-between p-4">
        <NuxtLink to="/" class="font-semibold">
          Antsy Tek
        </NuxtLink>
        <UColorModeButton />
      </div>
    </header>
    <main class="mx-auto max-w-3xl p-6">
      <slot />
    </main>
  </div>
</template>

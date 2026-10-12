<template>
  <div>
    <SiteHeader />
    <main class="mx-auto p-6" :class="$route.meta.wide ? 'max-w-6xl' : 'max-w-3xl'">
      <slot />
    </main>
  </div>
</template>

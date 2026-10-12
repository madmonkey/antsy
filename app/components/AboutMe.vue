<script setup lang="ts">
// Reusable on any page: <AboutMe /> uses site.about from app.config.ts; props override it.
const props = defineProps<{ title?: string, text?: string }>()
const { site } = useAppConfig()
</script>

<template>
  <section aria-labelledby="about-heading" class="space-y-3">
    <h2 id="about-heading" class="text-xl font-semibold">
      {{ props.title ?? 'About me' }}
    </h2>
    <p class="text-sm text-muted">
      {{ props.text ?? site.about }}
    </p>
  </section>
</template>

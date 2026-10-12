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
    <img v-if="site.avatar" :src="site.avatar" alt="" width="64" height="64" class="size-16 rounded-full">
    <p class="text-sm text-muted">
      {{ props.text ?? site.about }}
    </p>
    <SocialLinks v-if="site.social.length" :links="site.social" />
  </section>
</template>

import { existsSync, readFileSync } from 'node:fs'

// Route list written by scripts/prerender-routes.mjs before `nuxt generate`.
const routesFile = new URL('./.data/routes.json', import.meta.url)
const routes: string[] = existsSync(routesFile) ? JSON.parse(readFileSync(routesFile, 'utf8')) : []

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  ssr: true,
  colorMode: { preference: 'system' },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en-US' },
      title: 'Antsy Tek',
      meta: [{ name: 'description', content: 'Articles by Antsy Tek.' }]
    }
  },
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabasePublishableKey: ''
    }
  },
  nitro: {
    preset: 'github_pages',
    prerender: { routes, failOnError: true, crawlLinks: false }
  }
})

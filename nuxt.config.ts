import { existsSync, readFileSync } from 'node:fs'

// Route list written by scripts/prerender-routes.mjs before `nuxt generate`.
const routesFile = new URL('./.data/routes.json', import.meta.url)
const routes: string[] = existsSync(routesFile) ? JSON.parse(readFileSync(routesFile, 'utf8')) : []

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  ssr: true,
  routeRules: { '/admin/**': { ssr: false } },
  colorMode: { preference: 'system' },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en-US' },
      title: 'Fuckery Detected',
      meta: [{ name: 'description', content: 'Articles by Fuckery Detected.' }]
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

import { defineConfig } from '@playwright/test'

// e2e runs against the local Supabase stack (`npx supabase start`, seeded by supabase/seed.sql), never the hosted project.
// Set E2E_SUPABASE_KEY to the local publishable key (`npx supabase status`).
export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  expect: { timeout: 30_000 },
  timeout: 90_000,
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NUXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.E2E_SUPABASE_KEY ?? ''
    }
  }
})

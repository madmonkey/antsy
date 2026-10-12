import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'

const ADMIN = { email: 'admin@example.test', password: 'local-admin-password' }
const USER = { email: 'user@example.test', password: 'local-user-password' }

async function signIn(page: import('@playwright/test').Page, who: { email: string, password: string }) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(who.email)
  await page.getByLabel('Password').fill(who.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('administrator signs in and out', async ({ page }) => {
  await signIn(page, ADMIN)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/admin\/login/)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('anonymous /admin redirects to sign-in', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
})

test('a non-approved account is refused, and RLS denies its writes', async ({ page }) => {
  await signIn(page, USER)
  await expect(page.getByTestId('error')).toContainText('not approved')
  await expect(page).toHaveURL(/\/admin\/login/)

  const sb = createClient(process.env.NUXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321', process.env.E2E_SUPABASE_KEY ?? '')
  await sb.auth.signInWithPassword(USER)
  const { error } = await sb.from('topics').insert({ name: 'Sneaky', slug: 'sneaky' })
  expect(error).not.toBeNull()
})

test('the fourth attempt within 15 minutes is blocked', async ({ page }) => {
  for (let i = 0; i < 3; i++) {
    await signIn(page, { email: ADMIN.email, password: 'wrong-password' })
    await expect(page.getByTestId('error')).toContainText('Invalid email or password')
  }
  await expect(page.getByTestId('error')).toContainText('Try again after')
  await signIn(page, ADMIN)
  await expect(page.getByTestId('error')).toContainText('Too many failed attempts')
  await expect(page).toHaveURL(/\/admin\/login/)
})

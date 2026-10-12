import { expect, test, type Page } from '@playwright/test'

const ADMIN = { email: 'admin@example.test', password: 'local-admin-password' }
const unique = Date.now().toString(36)

async function signIn(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(ADMIN.email)
  await page.getByLabel('Password').fill(ADMIN.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
}

test('topic and article lifecycle', async ({ page }) => {
  await signIn(page)

  await page.goto('/admin/topics')
  await page.getByTestId('topic-name').fill(`Topic ${unique}`)
  await page.getByTestId('topic-active').check()
  await page.getByTestId('topic-previewable').check()
  await page.getByTestId('topic-save').click()
  await expect(page.getByTestId('saved')).toBeVisible()

  await page.goto('/admin/articles/new')
  await page.getByTestId('article-topic').selectOption({ label: `Topic ${unique}` })
  await page.getByTestId('article-title').fill(`Post ${unique}`)
  await page.getByTestId('editor-body').fill('Hello **world**')
  await expect(page.getByTestId('editor-preview').locator('strong')).toHaveText('world')
  await page.getByTestId('article-active').check()
  await page.getByTestId('article-save').click()
  await expect(page.getByTestId('article-item').filter({ hasText: `Post ${unique}` })).toBeVisible()

  // Duplicate address: refused with a suggestion, draft kept.
  await page.goto('/admin/articles/new')
  await page.getByTestId('article-title').fill(`Post ${unique}`)
  await page.getByTestId('editor-body').fill('Again')
  await page.getByTestId('article-save').click()
  await expect(page.getByTestId('error-slug')).toContainText(`post-${unique}-2`)
  await expect(page.getByTestId('editor-body')).toHaveValue('Again')

  // Published address is permanent.
  await page.goto('/admin')
  await page.getByRole('link', { name: `Post ${unique}` }).click()
  await page.getByTestId('article-slug').fill(`changed-${unique}`)
  await page.getByTestId('article-save').click()
  await expect(page.getByTestId('error-slug')).toContainText('permanent')

  // Deleting the topic needs confirmation and removes its articles.
  await page.goto('/admin/topics')
  page.once('dialog', d => { expect(d.message()).toContain('permanently deleted'); void d.accept() })
  await page.getByTestId('topic-row').filter({ hasText: `Topic ${unique}` }).getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByTestId('topic-row').filter({ hasText: `Topic ${unique}` })).toHaveCount(0)
})

test('rejects a non-image file with the allowed types', async ({ page }) => {
  await signIn(page)
  await page.goto('/admin/articles/new')
  await page.getByTestId('image-input').setInputFiles({ name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('<script>alert(1)</script>') })
  await expect(page.getByTestId('editor-message')).toContainText('PNG, JPEG, GIF or WebP')
})

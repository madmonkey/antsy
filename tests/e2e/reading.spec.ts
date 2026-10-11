import { expect, test } from '@playwright/test'

test('home -> topic -> article within 3 clicks', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Recent articles' })).toBeVisible()
  await page.getByRole('link', { name: 'Engineering' }).first().click()
  await expect(page.getByRole('heading', { name: 'Engineering', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Hello world' }).click()
  await expect(page.getByRole('heading', { name: 'Hello world', level: 1 })).toBeVisible()
  await expect(page).toHaveTitle(/Hello world/)
})

test('landing preview shows at most 3 and no inactive content', async ({ page }) => {
  await page.goto('/')
  const items = page.locator('[data-test=article]')
  await expect(items.first()).toBeVisible()
  expect(await items.count()).toBeLessThanOrEqual(3)
  await expect(page.getByText('Hidden draft')).toHaveCount(0)
  await expect(page.getByText('In inactive topic')).toHaveCount(0)
})

test('inactive topic, inactive article and unknown URLs show not-found', async ({ page }) => {
  for (const path of ['/topics/drafts', '/articles/hidden-draft', '/articles/in-inactive-topic', '/nope/nothing']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  }
})

test('direct load of an article URL works', async ({ page }) => {
  await page.goto('/articles/second-post')
  await expect(page.getByRole('heading', { name: 'Second post', level: 1 })).toBeVisible()
})

test('list queries never request body', async ({ page }) => {
  const listUrls: string[] = []
  page.on('request', (r) => {
    const u = r.url()
    if (u.includes('/rest/v1/') && !/slug=eq\./.test(u)) listUrls.push(u)
  })
  await page.goto('/')
  await expect(page.locator('[data-test=article]').first()).toBeVisible()
  await page.goto('/topics/engineering')
  await expect(page.getByRole('heading', { name: 'Engineering', level: 1 })).toBeVisible()
  expect(listUrls.length).toBeGreaterThan(0)
  for (const u of listUrls) expect(decodeURIComponent(u)).not.toMatch(/body/)
})

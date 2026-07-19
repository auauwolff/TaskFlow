import { test, expect } from '@playwright/test'

test('logs out locally and at the OIDC provider', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: "Ada Lovelace's projects" }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()

  await expect(page.getByRole('button', { name: 'Sign in securely' })).toBeVisible()
  const sessionResponse = await page.request.get('/api/auth/me')
  expect(sessionResponse.status()).toBe(401)
})

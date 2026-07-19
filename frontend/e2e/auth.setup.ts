import { mkdir } from 'node:fs/promises'
import { test as setup, expect } from '@playwright/test'

const authenticatedState = 'test-results/.auth/user.json'

setup('authenticate through the configured OIDC provider', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Turn plans into steady progress.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sign in securely' }).click()

  await expect(page).toHaveURL(/\/realms\/taskflow\//)
  await page.getByLabel('Username or email').fill('ada')
  await page.getByLabel('Password', { exact: true }).fill('taskflow')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: "Ada Lovelace's projects" }),
  ).toBeVisible()
  await expect(page.getByText('ada@example.com', { exact: true })).toBeVisible()

  await mkdir('test-results/.auth', { recursive: true })
  await page.context().storageState({ path: authenticatedState })
})

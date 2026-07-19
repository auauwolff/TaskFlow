import { test, expect } from '@playwright/test'

test('validates, creates, and persists a project', async ({ page }) => {
  const projectName = `E2E project ${Date.now()}`
  const description = 'Created through the browser against the complete TaskFlow stack.'

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 2, name: 'Projects' })).toBeVisible()

  await page.getByRole('button', { name: 'Create project' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a project name.')
  await expect(page.getByLabel('Project name')).toHaveAttribute('aria-invalid', 'true')

  await page.getByLabel('Project name').fill(projectName)
  await page.getByLabel(/^Description/).fill(description)
  await page.getByRole('button', { name: 'Create project' }).click()

  const createdProject = page.getByRole('listitem').filter({ hasText: projectName })
  await expect(createdProject.getByRole('heading', { level: 3, name: projectName })).toBeVisible()
  await expect(createdProject).toContainText(description)
  await expect(page.getByLabel('Project name')).toHaveValue('')
  await expect(page.getByLabel(/^Description/)).toHaveValue('')

  await page.reload()
  await expect(
    page.getByRole('listitem').filter({ hasText: projectName }).getByRole('heading', {
      level: 3,
      name: projectName,
    }),
  ).toBeVisible()
})

import { test, expect } from '@playwright/test'

test('uses the project URL to create, assign, complete, and restore a task', async ({ page }) => {
  const projectName = `Task workspace ${Date.now()}`
  const taskTitle = `Ship task slice ${Date.now()}`
  const taskDescription = 'Prove task state survives a deep-link reload.'

  await page.goto('/')
  await page.getByLabel('Project name').fill(projectName)
  await page.getByRole('button', { name: 'Create project' }).click()
  await page.getByRole('link', { name: projectName }).click()

  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { level: 2, name: projectName })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Tasks' })).toBeVisible()

  await page.getByRole('button', { name: 'Create task' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a task title.')

  await page.getByLabel('Task title').fill(taskTitle)
  await page.getByLabel('Priority').selectOption('high')
  await page.getByLabel(/^Description/).fill(taskDescription)
  await page.getByRole('button', { name: 'Create task' }).click()

  const task = page.getByRole('listitem').filter({ hasText: taskTitle })
  await expect(task).toContainText(taskDescription)
  await expect(task).toContainText('high priority')
  await expect(task).toContainText('todo')
  await expect(task).toContainText('Unassigned')

  await task.getByRole('button', { name: `Assign task to Ada Lovelace: ${taskTitle}` }).click()
  await expect(task).toContainText('Assigned to you')

  await task.getByRole('button', { name: `Complete task: ${taskTitle}` }).click()
  await expect(task).toContainText('done')
  await expect(task.getByRole('button', { name: `Complete task: ${taskTitle}` })).toHaveCount(0)

  const projectUrl = page.url()
  await page.reload()
  await expect(page).toHaveURL(projectUrl)
  await expect(page.getByRole('listitem').filter({ hasText: taskTitle })).toContainText(
    'Assigned to you',
  )
  await expect(page.getByRole('listitem').filter({ hasText: taskTitle })).toContainText('done')

  await page.getByRole('link', { name: 'Back to projects' }).click()
  await expect(page).toHaveURL('http://localhost:15173/')
  await expect(page.getByRole('link', { name: projectName })).toBeVisible()
})

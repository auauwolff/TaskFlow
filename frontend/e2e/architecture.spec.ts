import { expect, test, type Page } from '@playwright/test'

// The explorer is a public, frontend-only page: these tests run under the lightweight
// playwright.architecture.config.ts (no backend), and also pass inside the full-stack suite.

async function openExplorer(page: Page) {
  await page.goto('/architecture')
  await expect(page.getByRole('heading', { name: 'System explorer' })).toBeVisible()
}

function architectureNode(page: Page, label: string) {
  return page.locator('.architecture-node', { hasText: label })
}

test.describe('architecture explorer', () => {
  test('renders the repository overview with the arrow legend', async ({ page }) => {
    await openExplorer(page)

    await expect(architectureNode(page, 'Frontend application')).toBeVisible()
    await expect(architectureNode(page, 'Backend solution')).toBeVisible()
    await expect(page.getByText('Arrow key', { exact: true })).toBeVisible()
    await expect(page.getByText('Implements (inverted)')).toBeVisible()
    await expect(page.getByText('DI registration')).toBeVisible()

    await page.screenshot({ path: 'test-results/architecture/overview.png', fullPage: true })
  })

  test('distinguishes edge kinds in the composition view', async ({ page }) => {
    await openExplorer(page)
    await page.getByRole('button', { name: '02 Frontend' }).click()

    // Every feature gets a root 'adds module' registration; tasks additionally gets its
    // route-scoped workspace registration, and booting the router is runtime flow, not DI.
    await expect(architectureNode(page, 'Tasks feature')).toBeVisible()
    expect(await page.locator('.react-flow__edge.architecture-edge--registers').count()).toBe(4)
    expect(await page.locator('.react-flow__edge.architecture-edge--runtime').count()).toBe(1)

    await page.getByRole('button', { name: 'Composition / DI' }).click()

    await expect(architectureNode(page, 'composition.ts').first()).toBeVisible()
    await expect(architectureNode(page, 'projectsGatewayToken')).toBeVisible()
    expect(await page.locator('.react-flow__edge.architecture-edge--registers').count()).toBeGreaterThan(5)

    await page.screenshot({ path: 'test-results/architecture/composition.png', fullPage: true })
  })

  test('explains the feature-free pattern in a nutshell', async ({ page }) => {
    await openExplorer(page)
    await page.getByRole('button', { name: '02 Frontend' }).click()
    await page.getByRole('button', { name: 'In a nutshell' }).click()

    await expect(page.getByText('Every feature is this shape.')).toBeVisible()
    await expect(architectureNode(page, 'The port')).toBeVisible()
    await expect(architectureNode(page, 'The adapter')).toBeVisible()
    await expect(architectureNode(page, 'A feature module')).toBeVisible()

    // One anonymized slice: one inverted implements arrow, two registration steps, and the
    // instance flowing back out through container and token at runtime.
    expect(await page.locator('.react-flow__edge.architecture-edge--implements').count()).toBe(1)
    expect(await page.locator('.react-flow__edge.architecture-edge--registers').count()).toBe(2)
    expect(await page.locator('.react-flow__edge.architecture-edge--runtime').count()).toBe(2)

    await page.screenshot({ path: 'test-results/architecture/nutshell.png', fullPage: true })
  })

  test('shows the DI inversion lens with both arrow systems', async ({ page }) => {
    await openExplorer(page)
    await page.getByRole('button', { name: 'DI inversion' }).click()

    await expect(page.getByText('Two arrow systems, opposite directions.')).toBeVisible()
    await expect(architectureNode(page, 'useProjects.ts')).toBeVisible()
    await expect(architectureNode(page, 'ports.ts')).toBeVisible()
    await expect(architectureNode(page, 'httpProjectsGateway.ts')).toBeVisible()
    await expect(architectureNode(page, 'projectsGatewayToken')).toBeVisible()

    // The static system converges on the port; the runtime system flows the other way.
    expect(await page.locator('.react-flow__edge.architecture-edge--implements').count()).toBe(1)
    expect(await page.locator('.react-flow__edge.architecture-edge--runtime').count()).toBe(4)
    await expect(page.getByText('1. addProjectsModule(registrations)')).toBeVisible()

    await page.screenshot({ path: 'test-results/architecture/di-inversion.png', fullPage: true })
  })

  test('toggles the counterfactual and restores the port', async ({ page }) => {
    await openExplorer(page)
    await page.getByRole('button', { name: 'DI inversion' }).click()
    await page.getByRole('button', { name: 'Delete the port' }).click()

    await expect(page.getByText('What the port prevents.')).toBeVisible()
    expect(await page.locator('.react-flow__edge.architecture-edge--forbidden').count()).toBe(1)
    await expect(page.getByText('direct import — transport leaks into presentation')).toBeVisible()

    await page.screenshot({ path: 'test-results/architecture/counterfactual.png', fullPage: true })

    await page.getByRole('button', { name: 'Restore the port' }).click()
    await expect(page.getByText('Two arrow systems, opposite directions.')).toBeVisible()
  })

  test('highlights the focused lines when inspecting a node', async ({ page }) => {
    await openExplorer(page)
    await page.getByRole('button', { name: 'DI inversion' }).click()
    await architectureNode(page, 'projects/composition.ts').click()

    await expect(page.locator('.architecture-inspector')).toBeVisible()
    await expect(page.locator('.architecture-source__frame .line-focus').first()).toBeVisible()

    await page.screenshot({ path: 'test-results/architecture/focus-highlight.png', fullPage: true })
  })
})

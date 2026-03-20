import { test, expect } from '@playwright/test'

test.describe('Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('displays the main heading Richard Lloyd', async ({ page }) => {
    const heading = page.locator('#hero-heading')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Richard Lloyd')
  })

  test('typewriter element is present', async ({ page }) => {
    const typewriter = page.locator('#hero [aria-live="polite"]')
    await expect(typewriter).toBeVisible()
  })

  test('typewriter text changes over time', async ({ page }) => {
    const typewriter = page.locator('#hero [aria-live="polite"]')
    const initialLabel = await typewriter.getAttribute('aria-label')
    // Wait for typewriter to cycle to a different phrase (max 8 seconds)
    await page.waitForFunction(
      (initial) => {
        const el = document.querySelector('#hero [aria-live="polite"]')
        return el?.getAttribute('aria-label') !== initial
      },
      initialLabel,
      { timeout: 8000 },
    )
    const newLabel = await typewriter.getAttribute('aria-label')
    expect(newLabel).not.toBe(initialLabel)
  })

  test('primary CTA button is visible and labelled', async ({ page }) => {
    const cta = page.locator('#hero button:has-text("Start a Conversation")')
    await expect(cta).toBeVisible()
  })

  test('secondary CTA button is visible', async ({ page }) => {
    const secondary = page.locator('#hero button:has-text("View My Work")')
    await expect(secondary).toBeVisible()
  })

  test('animated grid background element is present', async ({ page }) => {
    const grid = page.locator('#hero .hero-grid')
    await expect(grid).toBeAttached()
  })

  test('hero section fills the viewport height', async ({ page }) => {
    const hero = page.locator('#hero')
    const box = await hero.boundingBox()
    const viewportHeight = page.viewportSize()?.height ?? 800
    expect(box?.height).toBeGreaterThanOrEqual(viewportHeight * 0.95)
  })

  test('CTA click scrolls to contact section', async ({ page }) => {
    await page.locator('#hero button:has-text("Start a Conversation")').click()
    await expect(page.locator('#contact')).toBeInViewport({ ratio: 0.2 })
  })
})

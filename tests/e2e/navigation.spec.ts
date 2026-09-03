import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('renders site name in header', async ({ page }) => {
    const header = page.locator('header[role="banner"]')
    await expect(header).toBeVisible()
    await expect(header).toContainText('Richard Lloyd')
  })

  test('all nav items are present on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav).toBeVisible()
    const navLabels = ['About', 'Services', 'AI Focus', 'Case Studies', 'Insights', 'Contact']
    for (const label of navLabels) {
      await expect(nav.locator(`button:has-text("${label}")`)).toBeVisible()
    }
  })

  test('clicking About nav scrolls to about section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const aboutBtn = page.locator('nav[aria-label="Main navigation"] button:has-text("About")')
    await aboutBtn.click()
    await expect(page.locator('#about')).toBeInViewport({ ratio: 0.3 })
  })

  test('clicking Services nav scrolls to services section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.locator('nav[aria-label="Main navigation"] button:has-text("Services")').click()
    await expect(page.locator('#services')).toBeInViewport({ ratio: 0.3 })
  })

  test('Hire Me button scrolls to contact section', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.locator('nav[aria-label="Main navigation"] button:has-text("Hire Me")').click()
    await expect(page.locator('#contact')).toBeInViewport({ ratio: 0.3 })
  })

  test('header becomes sticky after scrolling past hero', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const header = page.locator('header[role="banner"]')
    await expect(header).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, window.innerHeight))
    // Auto-retry until the sticky/backdrop class is applied — avoids a brittle
    // fixed-timing read that flakes on webkit (Safari) under CI load.
    await expect(header).toHaveClass(/backdrop-blur/)
  })

  test('nav links are keyboard accessible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.keyboard.press('Tab')
    // Skip nav should be focusable
    const skipNav = page.locator('.skip-nav')
    await expect(skipNav).toBeFocused()
  })
})

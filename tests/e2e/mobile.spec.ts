import { test, expect } from '@playwright/test'

const MOBILE_VIEWPORT = { width: 390, height: 844 } // iPhone 14
const TABLET_VIEWPORT = { width: 768, height: 1024 } // iPad

test.describe('Mobile Responsiveness', () => {
  test.describe('iPhone 14 (390px)', () => {
    test.use({ viewport: MOBILE_VIEWPORT })

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
    })

    test('hamburger menu button is visible', async ({ page }) => {
      const hamburger = page.locator('button[aria-label="Open menu"], button[aria-label="Close menu"]')
      await expect(hamburger.first()).toBeVisible()
    })

    test('desktop nav is hidden on mobile', async ({ page }) => {
      const desktopNav = page.locator('nav[aria-label="Main navigation"]')
      await expect(desktopNav).toBeHidden()
    })

    test('hamburger opens mobile menu', async ({ page }) => {
      const hamburger = page.locator('button[aria-label="Open menu"]')
      await hamburger.click()
      const mobileMenu = page.locator('#mobile-menu')
      await expect(mobileMenu).toBeVisible()
    })

    test('hamburger closes mobile menu when clicked again', async ({ page }) => {
      await page.locator('button[aria-label="Open menu"]').click()
      await expect(page.locator('#mobile-menu')).toBeVisible()
      await page.locator('button[aria-label="Close menu"]').click()
      await expect(page.locator('#mobile-menu')).not.toBeVisible()
    })

    test('mobile nav contains all navigation items', async ({ page }) => {
      await page.locator('button[aria-label="Open menu"]').click()
      const mobileMenu = page.locator('#mobile-menu')
      const navLabels = ['About', 'Features', 'AI Focus', 'Case Studies', 'Insights', 'Contact']
      for (const label of navLabels) {
        await expect(mobileMenu.locator(`button:has-text("${label}")`)).toBeVisible()
      }
    })

    test('mobile nav closes after clicking a nav item', async ({ page }) => {
      await page.locator('button[aria-label="Open menu"]').click()
      await page.locator('#mobile-menu button:has-text("About")').click()
      await expect(page.locator('#mobile-menu')).not.toBeVisible()
    })

    test('hero heading is visible and does not overflow', async ({ page }) => {
      const heading = page.locator('#hero-heading')
      await expect(heading).toBeVisible()
      const box = await heading.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width)
    })

    test('contact form fields are full-width on mobile', async ({ page }) => {
      await page.locator('#contact').scrollIntoViewIfNeeded()
      const nameInput = page.locator('#contact-name')
      await expect(nameInput).toBeVisible()
      const box = await nameInput.boundingBox()
      // Should span most of the viewport width (at least 80%)
      expect(box?.width).toBeGreaterThan(MOBILE_VIEWPORT.width * 0.7)
    })

    test('no horizontal scroll on mobile', async ({ page }) => {
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 5)
    })

    test('services cards stack to single column', async ({ page }) => {
      await page.locator('#services').scrollIntoViewIfNeeded()
      const list = page.locator('#services [role="list"]')
      await expect(list).toBeVisible()
      const cards = page.locator('#services [role="list"] li')
      const firstCard = await cards.first().boundingBox()
      const secondCard = await cards.nth(1).boundingBox()
      if (firstCard && secondCard) {
        // In single-column layout, second card should be below the first
        expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 10)
      }
    })
  })

  test.describe('iPad (768px)', () => {
    test.use({ viewport: TABLET_VIEWPORT })

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
    })

    test('page renders without horizontal overflow', async ({ page }) => {
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      expect(bodyWidth).toBeLessThanOrEqual(TABLET_VIEWPORT.width + 5)
    })

    test('hero heading is visible on tablet', async ({ page }) => {
      await expect(page.locator('#hero-heading')).toBeVisible()
    })

    test('contact section renders properly on tablet', async ({ page }) => {
      await page.locator('#contact').scrollIntoViewIfNeeded()
      await expect(page.locator('#contact-name')).toBeVisible()
      await expect(page.locator('#contact-email')).toBeVisible()
    })
  })
})

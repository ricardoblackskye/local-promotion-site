import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('page has a <main> landmark', async ({ page }) => {
    await expect(page.locator('main')).toBeAttached()
  })

  test('page has a <nav> landmark', async ({ page }) => {
    expect(await page.locator('nav').count()).toBeGreaterThan(0)
  })

  test('page has a <footer> landmark', async ({ page }) => {
    await expect(page.locator('footer[role="contentinfo"]')).toBeAttached()
  })

  test('skip navigation link is present', async ({ page }) => {
    const skipLink = page.locator('.skip-nav')
    await expect(skipLink).toBeAttached()
    await expect(skipLink).toHaveAttribute('href', '#about')
  })

  test('skip nav link becomes visible on focus', async ({ page }) => {
    await page.keyboard.press('Tab')
    const skipLink = page.locator('.skip-nav')
    await expect(skipLink).toBeFocused()
  })

  test('all form inputs have associated labels', async ({ page }) => {
    const inputs = await page.locator('input, textarea').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        expect(hasLabel, `Input #${id} has no associated label`).toBe(true)
      }
    }
  })

  test('interactive elements have discernible text or aria-label', async ({ page }) => {
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledby = await button.getAttribute('aria-labelledby')
      const hasAccessibleName = (text?.trim() ?? '') !== '' || !!ariaLabel || !!ariaLabelledby
      expect(hasAccessibleName, `Button "${text}" has no accessible name`).toBe(true)
    }
  })

  test('all images with src have non-empty alt attributes', async ({ page }) => {
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      // Decorative images should have role="presentation"
      if (role !== 'presentation') {
        expect(alt, 'Image is missing alt attribute').not.toBeNull()
        expect(alt?.trim(), 'Image has empty alt attribute').not.toBe('')
      }
    }
  })

  test('page title is descriptive', async ({ page }) => {
    const title = await page.title()
    expect(title).toContain('Richard Lloyd')
  })

  test('page has a lang attribute on <html>', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('axe-core: no critical accessibility violations on hero section', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('#hero')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(criticalViolations).toHaveLength(0)
  })

  test('axe-core: no critical accessibility violations on contact section', async ({ page }) => {
    await page.locator('#contact').scrollIntoViewIfNeeded()
    // Wait for Framer Motion entrance animations to complete before running axe.
    //
    // Do NOT wait on the heading's ancestor chain alone. This section uses
    // staggerChildren, so each element fades in on its own schedule: the heading
    // settles while its siblings are still mid-fade. axe measures the *rendered*
    // colour, and a parent below full opacity blends it with the background - which
    // is why this test reported #757575, #727272 and #6f6f6f on different runs,
    // all of them "failing" a #898989 token that is 6.00:1 against black and passes
    // AA outright. #6f6f6f is exactly #898989 at ~80% opacity over black. The token
    // was never the problem; the measurement was taken mid-transition.
    //
    // So wait for the text-bearing elements axe will actually measure to settle,
    // whatever schedule each of them is on.
    await page.waitForFunction(() => {
      const section = document.querySelector('#contact')
      if (!section) return false
      const measurable = section.querySelectorAll(
        'p, span, a, h1, h2, h3, h4, h5, h6, li, label, td, th',
      )
      if (measurable.length === 0) return false
      return Array.from(measurable).every((el) => {
        let node: Element | null = el
        while (node) {
          if (Number.parseFloat(getComputedStyle(node).opacity) < 0.99) return false
          if (node.id === 'contact') break
          node = node.parentElement
        }
        return true
      })
    })
    const results = await new AxeBuilder({ page })
      .include('#contact')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    )
    expect(criticalViolations).toHaveLength(0)
  })
})

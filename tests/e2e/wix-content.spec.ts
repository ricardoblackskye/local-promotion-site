import { test, expect } from '@playwright/test'
import blogPostsFixture from '../fixtures/blog-posts.json' with { type: 'json' }
import servicesFixture from '../fixtures/services.json' with { type: 'json' }
import caseStudiesFixture from '../fixtures/case-studies.json' with { type: 'json' }

// Mock Wix API calls so tests don't depend on live CMS
test.describe('Wix CMS Content', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Wix API requests and return fixtures
    await page.route('**/_api/wix-blog-backend/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ posts: blogPostsFixture }),
      })
    })

    await page.route('**/_api/wix-data/**', (route) => {
      const url = route.request().url()
      if (url.includes('services')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ dataItems: servicesFixture }),
        })
      } else if (url.includes('caseStudies')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ dataItems: caseStudiesFixture }),
        })
      } else {
        route.continue()
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Blog section', () => {
    test('blog section is present', async ({ page }) => {
      await expect(page.locator('#blog')).toBeVisible()
    })

    test('blog heading is visible', async ({ page }) => {
      await page.locator('#blog').scrollIntoViewIfNeeded()
      await expect(page.locator('#blog-heading')).toBeVisible()
    })

    test('renders blog post cards (fallback minimum)', async ({ page }) => {
      await page.locator('#blog').scrollIntoViewIfNeeded()
      // At least 1 blog card should render (fallback cards always present)
      const cards = page.locator('#blog [role="list"] li')
      await expect(cards).toHaveCount(3)
    })

    test('blog cards contain expected fixture post title (fallback)', async ({ page }) => {
      await page.locator('#blog').scrollIntoViewIfNeeded()
      await expect(
        page.locator('#blog').getByText('Why Most AI Strategies Fail Before They Start'),
      ).toBeVisible()
    })
  })

  test.describe('Services section', () => {
    test('services section is present', async ({ page }) => {
      await expect(page.locator('#services')).toBeVisible()
    })

    test('services heading visible', async ({ page }) => {
      await page.locator('#services').scrollIntoViewIfNeeded()
      await expect(page.locator('#services-heading')).toBeVisible()
    })

    test('renders 6 service cards (fallback)', async ({ page }) => {
      await page.locator('#services').scrollIntoViewIfNeeded()
      const cards = page.locator('#services [role="list"] li')
      await expect(cards).toHaveCount(6)
    })
  })

  test.describe('Case Studies section', () => {
    test('case studies section is present', async ({ page }) => {
      await expect(page.locator('#case-studies')).toBeVisible()
    })

    test('case studies heading visible', async ({ page }) => {
      await page.locator('#case-studies').scrollIntoViewIfNeeded()
      await expect(page.locator('#cases-heading')).toBeVisible()
    })

    test('renders case study cards', async ({ page }) => {
      await page.locator('#case-studies').scrollIntoViewIfNeeded()
      const cards = page.locator('#case-studies [role="list"] li')
      await expect(cards.first()).toBeVisible()
    })

    test('filter tabs are present', async ({ page }) => {
      await page.locator('#case-studies').scrollIntoViewIfNeeded()
      const filterTabs = page.locator('#case-studies [role="tablist"] button')
      const count = await filterTabs.count()
      expect(count).toBeGreaterThanOrEqual(1)
    })

    test('All filter tab is selected by default', async ({ page }) => {
      await page.locator('#case-studies').scrollIntoViewIfNeeded()
      const allTab = page.locator('#case-studies [role="tab"]:has-text("All")')
      await expect(allTab).toHaveAttribute('aria-selected', 'true')
    })

    test('clicking a filter tab changes selection', async ({ page }) => {
      await page.locator('#case-studies').scrollIntoViewIfNeeded()
      const tabs = page.locator('#case-studies [role="tab"]')
      const count = await tabs.count()
      if (count > 1) {
        await tabs.nth(1).click()
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
        await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false')
      }
    })
  })
})

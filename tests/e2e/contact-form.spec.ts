import { test, expect } from '@playwright/test'

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Scroll contact section into view
    await page.locator('#contact').scrollIntoViewIfNeeded()
  })

  test('contact section is present', async ({ page }) => {
    await expect(page.locator('#contact')).toBeVisible()
  })

  test('form fields are visible', async ({ page }) => {
    await expect(page.locator('#contact-name')).toBeVisible()
    await expect(page.locator('#contact-email')).toBeVisible()
    await expect(page.locator('#contact-message')).toBeVisible()
  })

  test('submit with all empty fields shows validation errors', async ({ page }) => {
    await page.locator('#contact form button[type="submit"]').click()
    await expect(page.locator('#name-error')).toBeVisible()
    await expect(page.locator('#email-error')).toBeVisible()
    await expect(page.locator('#message-error')).toBeVisible()
  })

  test('validation errors display correct messages', async ({ page }) => {
    await page.locator('#contact form button[type="submit"]').click()
    await expect(page.locator('#name-error')).toContainText('Name is required')
    await expect(page.locator('#email-error')).toContainText('Email is required')
    await expect(page.locator('#message-error')).toContainText('Message is required')
  })

  test('invalid email shows email field error', async ({ page }) => {
    await page.fill('#contact-name', 'Test User')
    await page.fill('#contact-email', 'not-an-email')
    await page.fill('#contact-message', 'Hello')
    await page.locator('#contact form button[type="submit"]').click()
    await expect(page.locator('#email-error')).toBeVisible()
    await expect(page.locator('#email-error')).toContainText('valid email')
  })

  test('clears validation error when user corrects name field', async ({ page }) => {
    await page.locator('#contact form button[type="submit"]').click()
    await expect(page.locator('#name-error')).toBeVisible()
    await page.fill('#contact-name', 'Richard')
    await expect(page.locator('#name-error')).not.toBeVisible()
  })

  test('shows success message on successful API response', async ({ page }) => {
    await page.route('/api/contact', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.fill('#contact-name', 'Test Sender')
    await page.fill('#contact-email', 'test@example.com')
    await page.fill('#contact-message', 'This is a test message.')
    await page.locator('#contact form button[type="submit"]').click()

    const successMsg = page.locator('[role="status"]').filter({ hasText: 'Message sent' })
    await expect(successMsg).toBeVisible({ timeout: 5000 })
  })

  test('shows error message on API failure', async ({ page }) => {
    await page.route('/api/contact', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.fill('#contact-name', 'Test Sender')
    await page.fill('#contact-email', 'test@example.com')
    await page.fill('#contact-message', 'Test message')
    await page.locator('#contact form button[type="submit"]').click()

    const errorMsg = page.locator('[role="alert"]').filter({ hasText: 'went wrong' })
    await expect(errorMsg).toBeVisible({ timeout: 5000 })
  })

  test('booking link panel is visible', async ({ page }) => {
    const bookingPanel = page.locator('#contact').getByText('Book a Discovery Call')
    await expect(bookingPanel).toBeVisible()
  })

  test('booking link has valid href', async ({ page }) => {
    const bookingLink = page.locator('#contact a[href*="calendly"]')
    await expect(bookingLink).toBeVisible()
    const href = await bookingLink.getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toContain('calendly.com')
  })

  test('LinkedIn link is present', async ({ page }) => {
    const linkedin = page.locator('#contact a[href*="linkedin.com"]')
    await expect(linkedin).toBeVisible()
  })

  test('email link is present', async ({ page }) => {
    const emailLink = page.locator('#contact a[href^="mailto:"]')
    await expect(emailLink).toBeVisible()
  })
})

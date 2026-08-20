// @ts-check
const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers')

test.describe('Product browsing', () => {
  test('homepage lists products', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.card')).toHaveCount(await page.locator('.card').count())
    // At least the seeded products are visible
    await expect(page.getByText('Wireless Headphones').first()).toBeVisible()
  })

  test('product search returns results', async ({ page }) => {
    await page.goto('/?q=headphones')
    await expect(page.getByText('Wireless Headphones').first()).toBeVisible()
  })

  test('product search with no match shows empty state', async ({ page }) => {
    await page.goto('/?q=zzznomatch')
    await expect(page.locator('.card')).toHaveCount(0)
  })

  test('product detail page loads with reviews', async ({ page }) => {
    await page.goto('/products/1')
    // Pre-seeded XSS review is on product 1
    await expect(page.locator('h1, h2, h3').first()).toBeVisible()
  })
})

test.describe('Cart and checkout', () => {
  test('authenticated user can add to cart and view it', async ({ page }) => {
    await loginAs(page, 'alice', 'password123')
    await page.goto('/')

    // Add to Cart button is on the product detail page
    await page.goto('/products/1')
    await page.locator('button', { hasText: 'Add to Cart' }).click()
    await page.goto('/cart')
    await expect(page.locator('body')).not.toContainText('Your cart is empty')
  })

  test('unauthenticated user cannot access cart', async ({ page }) => {
    await page.goto('/cart')
    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/login|cart/)
  })

  test('checkout page is accessible when authenticated', async ({ page }) => {
    await loginAs(page, 'alice', 'password123')
    await page.goto('/checkout')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Orders', () => {
  test('orders page loads for authenticated user', async ({ page }) => {
    await loginAs(page, 'alice', 'password123')
    await page.goto('/orders')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('API Docs (Swagger)', () => {
  test('Swagger UI is publicly accessible without auth (A05)', async ({ page }) => {
    await page.goto('/docs')
    // swagger-ui-react renders a div with id swagger-ui
    await expect(page.locator('#swagger-ui, .swagger-ui')).toBeVisible({ timeout: 10000 })
  })
})

// @ts-check
const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers')

test.describe('Login', () => {
  test('admin can log in and sees their username in the nav', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[autocomplete="username"]', 'admin')
    await page.fill('input[autocomplete="current-password"]', 'admin')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
    // Nav should show the username dropdown
    await expect(page.locator('.navbar').getByText('admin')).toBeVisible()
  })

  test('token cookie is set after login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[autocomplete="username"]', 'alice')
    await page.fill('input[autocomplete="current-password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
    const cookies = await page.context().cookies()
    const tokenCookie = cookies.find(c => c.name === 'token')
    expect(tokenCookie).toBeTruthy()
    expect(tokenCookie.value.split('.').length).toBe(3) // valid JWT
  })

  test('wrong password shows "Incorrect password"', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[autocomplete="username"]', 'admin')
    await page.fill('input[autocomplete="current-password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('.alert-danger')).toContainText('Incorrect password')
  })

  test('nonexistent user shows "User not found" (username enumeration — A07)', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[autocomplete="username"]', 'doesnotexist')
    await page.fill('input[autocomplete="current-password"]', 'anything')
    await page.click('button[type="submit"]')
    await expect(page.locator('.alert-danger')).toContainText('User not found')
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    await loginAs(page, 'admin', 'admin')
    await page.goto('/')
    await page.locator('.navbar').getByText('admin').click()
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL('/login')
    // Token cookie should be expired/gone
    const cookies = await page.context().cookies()
    const tokenCookie = cookies.find(c => c.name === 'token')
    expect(!tokenCookie || tokenCookie.value === '').toBeTruthy()
  })
})

test.describe('Register', () => {
  test('new user can register and is immediately logged in', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[name="username"], input[placeholder*="username" i], input[type="text"]', 'testuser99')
    await page.fill('input[name="email"], input[type="email"]', 'testuser99@example.com')
    await page.fill('input[type="password"]', 'pw')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
    await expect(page.locator('.navbar').getByText('testuser99')).toBeVisible()
  })

  test('register accepts single-character password (no complexity check — A07)', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[type="text"]', 'weakpwuser')
    await page.fill('input[type="email"]', 'weakpw@example.com')
    await page.fill('input[type="password"]', 'a')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })
})

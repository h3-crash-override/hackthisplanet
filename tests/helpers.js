const BASE_URL = process.env.BASE_URL || 'https://hackthisplanet.vercel.app'
const RESET_KEY = process.env.RESET_KEY || 'resetme123'

// Reset DB to seed state before a test run
async function resetDB() {
  const res = await fetch(`${BASE_URL}/api/reset?key=${RESET_KEY}`, { method: 'POST' })
  if (!res.ok) throw new Error(`DB reset failed: ${res.status}`)
}

// Log in via API and return the JWT (avoids UI for setup)
async function apiLogin(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Login failed: ${data.error}`)
  return data.token
}

// Set auth cookie on a Playwright page via API (faster than UI login)
async function loginAs(page, username, password) {
  const token = await apiLogin(username, password)
  await page.goto('/')
  await page.evaluate((t) => {
    document.cookie = `token=${t}; path=/`
  }, token)
  return token
}

module.exports = { resetDB, apiLogin, loginAs, BASE_URL }

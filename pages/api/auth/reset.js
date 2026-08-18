// POST /api/auth/reset
// Vulnerabilities: A04 (predictable reset token = MD5(email), no expiry, no rate limiting)
const db = require('../../../lib/db')
const { md5 } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { email, token, new_password } = req.body || {}

  if (!email) {
    return res.status(400).json({ error: 'email required' })
  }

  try {
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email])
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Reset token is MD5(email) — fully predictable, no expiry - A04
    const resetToken = md5(email)

    if (token && new_password) {
      // Verify token and reset password
      if (token !== resetToken) {
        return res.status(400).json({ error: 'Invalid reset token' })
      }
      await db.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [md5(new_password), email]
      )
      return res.status(200).json({ message: 'Password reset successfully' })
    }

    // Return the token directly in the response - A04 (no out-of-band delivery)
    return res.status(200).json({
      message: 'Reset token generated',
      token: resetToken,
      hint: 'Token is MD5 of your email address',
    })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

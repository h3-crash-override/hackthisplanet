// GET/PUT /api/users/:id
// Vulnerabilities: A01 (IDOR), A02 (returns password hash + plaintext CC), A08 (node-serialize RCE on profile cookie)
const db = require('../../../lib/db')
const { getUser } = require('../../../lib/auth')
const serialize = require('node-serialize')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Login required' })

  const { id } = req.query

  // Deserialize 'profile' cookie using node-serialize — RCE if attacker controls cookie - A08
  // Exploit: set cookie profile=<base64 of {"x":"_$$ND_FUNC$$_function(){require('child_process').exec('...')}()"}>
  try {
    const profileCookie = req.cookies.profile
    if (profileCookie) {
      const decoded = Buffer.from(profileCookie, 'base64').toString('utf8')
      serialize.unserialize(decoded)
    }
  } catch { /* silent */ }

  try {
    if (req.method === 'GET') {
      // No ownership check - A01 (IDOR)
      const result = await db.query('SELECT * FROM users WHERE id = $1', [id])
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })

      // Returns full row including password hash and credit_card - A02
      return res.status(200).json(result.rows[0])
    }

    if (req.method === 'PUT') {
      // No ownership check - A01 (IDOR)
      const { address, credit_card } = req.body || {}
      const result = await db.query(
        'UPDATE users SET address = COALESCE($1, address), credit_card = COALESCE($2, credit_card) WHERE id = $3 RETURNING *',
        [address, credit_card, id]
      )
      return res.status(200).json(result.rows[0])
    }

    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

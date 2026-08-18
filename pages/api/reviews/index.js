// POST /api/reviews
// Vulnerabilities: A03 (stored XSS - body not sanitized)
const db = require('../../../lib/db')
const { getUser } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Login required' })

  const { product_id, rating, body } = req.body || {}
  if (!product_id || !body) {
    return res.status(400).json({ error: 'product_id and body required' })
  }

  try {
    // body is stored as-is — no sanitization, XSS on render - A03
    const result = await db.query(
      'INSERT INTO reviews (product_id, user_id, rating, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, user.id, rating || null, body]
    )
    return res.status(201).json(result.rows[0])
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

// GET/PUT /api/cart/:userId
// Vulnerabilities: A01 (IDOR - no ownership check), A04 (negative quantities accepted)
const db = require('../../../lib/db')
const { getUser } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Login required' })

  const { userId } = req.query
  // No ownership check - A01 (IDOR): any logged-in user can read/modify any cart

  try {
    if (req.method === 'GET') {
      const result = await db.query(
        `SELECT c.*, p.name, p.price, p.image_url FROM carts c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = $1`,
        [userId]
      )
      return res.status(200).json(result.rows)
    }

    if (req.method === 'PUT') {
      const { product_id, quantity } = req.body || {}
      if (!product_id) return res.status(400).json({ error: 'product_id required' })

      // Negative quantities accepted - A04 (insecure design)
      if (quantity === 0) {
        await db.query(
          'DELETE FROM carts WHERE user_id = $1 AND product_id = $2',
          [userId, product_id]
        )
      } else {
        await db.query(
          `INSERT INTO carts (user_id, product_id, quantity) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = $3`,
          [userId, product_id, quantity]
        )
      }
      return res.status(200).json({ message: 'Cart updated' })
    }

    if (req.method === 'DELETE') {
      await db.query('DELETE FROM carts WHERE user_id = $1', [userId])
      return res.status(200).json({ message: 'Cart cleared' })
    }

    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

// GET /api/products/:id
// Vulnerabilities: A03 (SQL injection via id param)
const db = require('../../../lib/db')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { id } = req.query

  try {
    // SQL injection - A03: id is not parameterized
    const product = await db.query(`SELECT * FROM products WHERE id = ${id}`)
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const reviews = await db.query(
      `SELECT r.*, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ${id} ORDER BY r.created_at DESC`
    )

    return res.status(200).json({ ...product.rows[0], reviews: reviews.rows })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

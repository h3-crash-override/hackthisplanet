// GET /api/products?q=&category=
// Vulnerabilities: A03 (SQL injection via q param)
const db = require('../../../lib/db')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  const { q, category } = req.query

  try {
    let query
    if (q) {
      // SQL injection - A03: search param interpolated directly
      query = `SELECT * FROM products WHERE name ILIKE '%${q}%' OR description ILIKE '%${q}%' ORDER BY id`
    } else if (category) {
      query = `SELECT * FROM products WHERE category = '${category}' ORDER BY id`
    } else {
      query = 'SELECT * FROM products ORDER BY id'
    }

    const result = await db.query(query)
    return res.status(200).json(result.rows)
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

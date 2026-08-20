// GET /api/orders/:id
// POST /api/orders (id='new') - place order
// Vulnerabilities: A01 (IDOR), A02 (plaintext CC in response), A04 (unlimited coupon use)
const db = require('../../../lib/db')
const { getUser } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Login required' })

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      if (id === 'list') {
        // List orders for logged-in user
        const result = await db.query(
          `SELECT o.*, json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'name', p.name)) as items
           FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN products p ON oi.product_id = p.id
           WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
          [user.id]
        )
        return res.status(200).json(result.rows)
      }

      // No ownership check - A01 (IDOR): any user can view any order
      const result = await db.query(
        `SELECT o.*, json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'name', p.name)) as items
         FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = $1 GROUP BY o.id`,
        [id]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' })

      // Returns credit_card in plaintext - A02
      return res.status(200).json(result.rows[0])
    }

    if (req.method === 'POST' && id === 'new') {
      const { shipping_address, credit_card, coupon_code } = req.body || {}

      const cartResult = await db.query(
        `SELECT c.*, p.price FROM carts c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1`,
        [user.id]
      )
      if (cartResult.rows.length === 0) return res.status(400).json({ error: 'Cart is empty' })

      let total = cartResult.rows.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Coupon can be applied without limit - A04 (insecure design)
      if (coupon_code === 'SAVE10') total = total * 0.9

      // Store credit card in plaintext - A02
      const order = await db.query(
        `INSERT INTO orders (user_id, total, credit_card, shipping_address)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [user.id, total.toFixed(2), credit_card, shipping_address]
      )
      const orderId = order.rows[0].id

      for (const item of cartResult.rows) {
        await db.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [orderId, item.product_id, item.quantity, item.price]
        )
      }

      // Trigger webhooks - SSRF via webhook URLs - A10
      const webhooks = await db.query('SELECT url FROM webhooks WHERE user_id = $1', [user.id])
      for (const wh of webhooks.rows) {
        try {
          await fetch(wh.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'order.created', order_id: orderId }),
            signal: AbortSignal.timeout(3000),
          })
        } catch { /* silent */ }
      }

      await db.query('DELETE FROM carts WHERE user_id = $1', [user.id])
      return res.status(201).json(order.rows[0])
    }

    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

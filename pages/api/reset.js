// POST /api/reset?key=<RESET_KEY>
// Drops and re-seeds all data — use before each scan or demo
const db = require('../../lib/db')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { key } = req.query
  const RESET_KEY = process.env.RESET_KEY || 'resetme123'

  if (key !== RESET_KEY) {
    return res.status(403).json({ error: 'Invalid reset key' })
  }

  try {
    // Truncate all tables
    await db.query('TRUNCATE order_items, orders, carts, reviews, webhooks, users, products RESTART IDENTITY CASCADE')

    // Re-seed users
    await db.query(`
      INSERT INTO users (username, email, password, role, credit_card, address) VALUES
      ('admin',   'admin@nexusstore.com', '21232f297a57a5a743894a0e4a801fc3', 'admin', '4111111111111111', '1 Admin Way, San Francisco, CA 94102'),
      ('alice',   'alice@example.com',   '482c811da5d5b4bc6d497ffa98491e38', 'user',  '4242424242424242', '123 Main St, Austin, TX 78701'),
      ('bob',     'bob@example.com',     'd8578edf8458ce06fbc5bb76a58c5ca4', 'user',  '5555555555554444', '456 Oak Ave, New York, NY 10001'),
      ('charlie', 'charlie@example.com', '0d107d09f5bbe40cade3de5c71e9e9b7', 'user',  NULL,               '789 Pine Rd, Seattle, WA 98101')
    `)

    await db.query(`
      INSERT INTO products (name, description, price, stock, image_url, category) VALUES
      ('Wireless Headphones Pro',  'Premium noise-canceling headphones with 30-hour battery life and superior sound quality.', 149.99, 50,  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'Electronics'),
      ('Classic Cotton T-Shirt',   '100% organic cotton, machine washable, available in multiple colors.',                     24.99, 200, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 'Clothing'),
      ('Running Shoes Elite',      'Lightweight performance shoes with responsive cushioning and breathable mesh upper.',       89.99, 75,  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 'Footwear'),
      ('Smart Watch Series X',     'Advanced smartwatch with health monitoring, GPS, and 5-day battery.',                     299.99, 30, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 'Electronics'),
      ('Genuine Leather Wallet',   'Slim bifold wallet, full-grain leather, RFID blocking.',                                   45.00, 120, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', 'Accessories'),
      ('Premium Yoga Mat',         'Non-slip mat with alignment lines and carrying strap, 6mm thickness.',                     39.99, 90,  'https://images.unsplash.com/photo-1601925228843-8b6e10f6c04e?w=400', 'Sports'),
      ('Coffee Maker Deluxe',      '12-cup programmable coffee maker with built-in grinder and thermal carafe.',               79.99, 40,  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'Home'),
      ('UV400 Sunglasses',         'Polarized lenses with 100% UV protection. Lightweight titanium frame.',                    59.99, 65,  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 'Accessories'),
      ('Laptop Backpack Pro',      'Water-resistant 30L backpack with padded laptop compartment and USB charging port.',       69.99, 85,  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Bags'),
      ('Bluetooth Speaker Mini',   'Portable waterproof speaker with 360-degree sound and 12-hour playtime.',                  49.99, 110, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', 'Electronics')
    `)

    await db.query(`
      INSERT INTO reviews (product_id, user_id, rating, body) VALUES
      (1, 2, 5, 'Amazing sound quality! Best headphones I''ve ever owned.'),
      (1, 3, 3, '<img src=x onerror="alert(''XSS: ''+document.cookie)">'),
      (3, 2, 4, 'Great shoes, very comfortable. Sizing runs slightly small.'),
      (4, 3, 5, 'Love this watch. Health features are incredibly accurate.'),
      (7, 2, 4, 'Makes great coffee! Easy to program and clean.')
    `)

    await db.query(`
      INSERT INTO orders (id, user_id, total, status, credit_card, shipping_address) VALUES
      (1, 2, 299.98, 'delivered', '4242424242424242', '123 Main St, Austin, TX 78701'),
      (2, 2,  89.99, 'shipped',   '4242424242424242', '123 Main St, Austin, TX 78701'),
      (3, 3, 299.99, 'pending',   '5555555555554444', '456 Oak Ave, New York, NY 10001')
    `)

    await db.query(`
      INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
      (1, 1, 2, 149.99),
      (2, 3, 1,  89.99),
      (3, 4, 1, 299.99)
    `)

    return res.status(200).json({ message: 'Database reset to initial seed state' })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

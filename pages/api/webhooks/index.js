// GET/POST /api/webhooks
// Vulnerabilities: A10 (SSRF - server fetches webhook URL on registration to "verify")
const db = require('../../../lib/db')
const { getUser } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()

  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Login required' })

  try {
    if (req.method === 'GET') {
      const result = await db.query('SELECT * FROM webhooks WHERE user_id = $1', [user.id])
      return res.status(200).json(result.rows)
    }

    if (req.method === 'POST') {
      const { url } = req.body || {}
      if (!url) return res.status(400).json({ error: 'url required' })

      // SSRF - A10: server fetches the user-supplied URL to "verify" it's reachable
      let verifyStatus = null
      try {
        const verify = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        verifyStatus = verify.status
      } catch (e) {
        verifyStatus = `error: ${e.message}`
      }

      const result = await db.query(
        'INSERT INTO webhooks (user_id, url) VALUES ($1, $2) RETURNING *',
        [user.id, url]
      )
      return res.status(201).json({ ...result.rows[0], verify_status: verifyStatus })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      await db.query('DELETE FROM webhooks WHERE id = $1 AND user_id = $2', [id, user.id])
      return res.status(200).json({ message: 'Webhook deleted' })
    }

    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

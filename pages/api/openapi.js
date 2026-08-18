// GET /api/openapi - serves OpenAPI spec (no auth required - A05)
const spec = require('../../lib/swagger')

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  return res.status(200).json(spec)
}

// POST /api/admin/import-image?url=<url>
// Vulnerabilities: A10 (SSRF), A01 (no auth check — accessible by any user)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // No auth check - A01 (broken access control)
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'url query parameter required' })
  }

  try {
    // SSRF - A10: fetches any URL server-side without validation
    // Can reach internal services, cloud metadata APIs, localhost, etc.
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    })

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const text = await response.text()

    return res.status(200).json({
      url,
      status: response.status,
      content_type: contentType,
      content: text.slice(0, 5000),
      size: text.length,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

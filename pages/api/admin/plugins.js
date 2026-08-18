// POST /api/admin/plugins
// Vulnerabilities: A08 (eval of fetched remote JS), A06 (lodash prototype pollution via _.merge)
const _ = require('lodash')

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  // No auth check - A01
  const { plugin_url, settings } = req.body || {}

  const result = { installed: false, config: {}, prototype_polluted: false }

  try {
    // Prototype pollution via lodash@4.17.4 _.merge - A06/A04
    // Try: settings = {"__proto__":{"isAdmin":true,"polluted":"yes"}}
    if (settings) {
      const userConfig = JSON.parse(settings)
      _.merge(result.config, userConfig)
      result.prototype_polluted = ({}).isAdmin === true
    }

    // Fetch and eval remote JavaScript - A08 (software integrity failure)
    if (plugin_url) {
      const response = await fetch(plugin_url, { signal: AbortSignal.timeout(5000) })
      const code = await response.text()
      // eval() of untrusted remote code - A08
      const evalResult = eval(code)  // eslint-disable-line no-eval
      result.installed = true
      result.eval_result = String(evalResult).slice(0, 500)
    }

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack })
  }
}

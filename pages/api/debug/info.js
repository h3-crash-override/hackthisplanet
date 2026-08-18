// GET /api/debug/info
// Vulnerabilities: A05 (exposes environment variables, connection strings, secrets)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  // No auth check - A05 (security misconfiguration)
  return res.status(200).json({
    app: 'NexusStore',
    version: '1.0.0',
    node_version: process.version,
    environment: process.env,  // Dumps ALL env vars including secrets - A05
    uptime_seconds: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    cwd: process.cwd(),
  })
}

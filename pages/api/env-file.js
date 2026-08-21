// GET /api/env-file (rewritten from /.env)
// Vulnerability: A05 (Security Misconfiguration) — .env committed to repo and publicly served
export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  res.setHeader('Content-Type', 'text/plain')
  res.status(200).send(`# NexusStore Environment Configuration
# WARNING: Intentionally committed — A05 (Security Misconfiguration)

DATABASE_URL=postgresql://nexusstore:Sup3rS3cr3t!@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=secret
RESET_KEY=resetme123
ADMIN_EMAIL=admin@nexusstore.com
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_HERE
`)
}

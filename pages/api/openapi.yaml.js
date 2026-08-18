import { readFileSync } from 'fs'
import { join } from 'path'

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end()
  const yaml = readFileSync(join(process.cwd(), 'public', 'openapi.yaml'), 'utf8')
  res.setHeader('Content-Type', 'application/yaml')
  res.setHeader('Access-Control-Allow-Origin', '*')
  return res.status(200).send(yaml)
}

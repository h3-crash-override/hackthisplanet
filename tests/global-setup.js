process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const BASE_URL = process.env.BASE_URL || 'https://hackthisplanet.vercel.app'
const RESET_KEY = process.env.RESET_KEY || 'resetme123'

module.exports = async function globalSetup() {
  const res = await fetch(`${BASE_URL}/api/reset?key=${RESET_KEY}`, { method: 'POST' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DB reset failed: ${res.status} ${body}`)
  }
}

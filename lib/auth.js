const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// Hardcoded secret - A02
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true })
    // A07: explicitly accept alg:none — no signature required
    if (decoded?.header?.alg === 'none') {
      return decoded.payload
    }
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch {
    return null
  }
}

function getUser(req) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return null
  return verifyToken(token)
}

module.exports = { md5, signToken, verifyToken, getUser }

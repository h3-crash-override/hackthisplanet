import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

function getToken() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function Profile() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ address: '', credit_card: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!id) return
    const token = getToken()
    if (!token) { router.push('/login'); return }
    // IDOR: fetches any user ID without ownership check - A01
    fetch(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setUser(data)
        setForm({ address: data.address || '', credit_card: data.credit_card || '' })
      })
  }, [id])

  async function save(e) {
    e.preventDefault()
    const token = getToken()
    // IDOR: updates any user - A01
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setUser(data)
    setMsg('Profile updated!')
    setTimeout(() => setMsg(''), 2000)
  }

  if (!user) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
  if (user.error) return <div className="alert alert-danger">{user.error}</div>

  return (
    <>
      <h4 className="mb-4">User Profile</h4>
      <div className="row g-4">
        <div className="col-md-5">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h6>Account Information</h6>
              <dl className="row small mb-0">
                <dt className="col-4">User ID</dt><dd className="col-8">{user.id}</dd>
                <dt className="col-4">Username</dt><dd className="col-8">{user.username}</dd>
                <dt className="col-4">Email</dt><dd className="col-8">{user.email}</dd>
                <dt className="col-4">Role</dt><dd className="col-8"><span className="badge bg-secondary">{user.role}</span></dd>
                {/* Password hash exposed - A02 */}
                <dt className="col-4 text-danger">Password</dt>
                <dd className="col-8 text-danger" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                  {user.password}
                </dd>
                {/* Plaintext credit card exposed - A02 */}
                <dt className="col-4 text-danger">Card</dt>
                <dd className="col-8 text-danger">{user.credit_card || 'none'}</dd>
              </dl>
              <div className="alert alert-warning py-1 mt-2 small mb-0">
                Password hash (MD5, unsalted) and credit card returned by API — A01 + A02.
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6>Edit Profile</h6>
              {msg && <div className="alert alert-success py-1">{msg}</div>}
              <form onSubmit={save}>
                <div className="mb-3">
                  <label className="form-label">Shipping Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Credit Card</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.credit_card}
                    onChange={(e) => setForm({ ...form, credit_card: e.target.value })}
                  />
                  <div className="form-text text-danger">Stored in plaintext (A02).</div>
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

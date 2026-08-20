import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        document.cookie = `token=${data.token}; path=/`
        router.push('/')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-5 col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="mb-4">Sign In</h4>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <hr />
            <p className="text-center text-muted small mb-0">
              No account?{' '}
              <Link href="/register">Register</Link>
            </p>
            <div className="mt-3 p-2 bg-light rounded small text-muted">
              <strong>Demo accounts:</strong>
              <br />admin / admin &nbsp;|&nbsp; alice / password123 &nbsp;|&nbsp; bob / qwerty
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

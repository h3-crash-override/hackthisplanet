import { useState, useEffect } from 'react'

// No server-side auth check - A01 (broken access control, security by obscurity)
// This page is accessible to any user who knows the URL

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [imgUrl, setImgUrl] = useState('http://169.254.169.254/latest/meta-data/')
  const [imgResult, setImgResult] = useState(null)
  const [pluginUrl, setPluginUrl] = useState('')
  const [pluginSettings, setPluginSettings] = useState('{"__proto__":{"isAdmin":true}}')
  const [pluginResult, setPluginResult] = useState(null)
  const [dbInfo, setDbInfo] = useState(null)
  const [uploads, setUploads] = useState(null)

  useEffect(() => {
    // Fetch all users (including password hashes) - A01, A02
    fetch('/api/users/1').then(() => {})
    // Simulate fetching user list via sequential IDOR
    Promise.all([1, 2, 3, 4].map((i) =>
      fetch(`/api/users/${i}`).then((r) => r.json()).catch(() => null)
    )).then((results) => setUsers(results.filter(Boolean).filter((u) => !u.error)))

    fetch('/api/orders/list').then((r) => r.json()).then((d) => setAllOrders(Array.isArray(d) ? d : []))
  }, [])

  async function importImage(e) {
    e.preventDefault()
    const res = await fetch(`/api/admin/import-image?url=${encodeURIComponent(imgUrl)}`, { method: 'POST' })
    setImgResult(await res.json())
  }

  async function installPlugin(e) {
    e.preventDefault()
    const res = await fetch('/api/admin/plugins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plugin_url: pluginUrl, settings: pluginSettings }),
    })
    setPluginResult(await res.json())
  }

  async function loadDebug() {
    const res = await fetch('/api/debug/info')
    setDbInfo(await res.json())
  }

  async function loadUploads() {
    const res = await fetch('/api/uploads')
    setUploads(await res.json())
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Admin Panel</h4>
        <span className="badge bg-danger">No authentication required (A01)</span>
      </div>

      {/* Users table */}
      <div className="card shadow-sm mb-4">
        <div className="card-header"><h6 className="mb-0">All Users (password hashes + credit cards exposed)</h6></div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Password (MD5)</th><th>Credit Card</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="badge bg-secondary">{u.role}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{u.password}</td>
                    <td className="text-danger">{u.credit_card || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* SSRF: Import Image */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h6 className="mb-0">Import Product Image (SSRF — A10)</h6>
            </div>
            <div className="card-body">
              <form onSubmit={importImage}>
                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <div className="form-text">Try: http://169.254.169.254/latest/meta-data/</div>
                </div>
                <button type="submit" className="btn btn-sm btn-warning">Fetch URL</button>
              </form>
              {imgResult && (
                <pre className="mt-2 p-2 bg-dark text-success rounded small" style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(imgResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Plugin installer: eval + prototype pollution */}
        <div className="col-md-6">
          <div className="card shadow-sm h-100">
            <div className="card-header">
              <h6 className="mb-0">Plugin Installer (eval + Prototype Pollution — A08/A06)</h6>
            </div>
            <div className="card-body">
              <form onSubmit={installPlugin}>
                <div className="mb-2">
                  <label className="form-label small">Plugin JS URL (fetched and eval'd)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={pluginUrl}
                    onChange={(e) => setPluginUrl(e.target.value)}
                    placeholder="https://attacker.com/payload.js"
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Settings JSON (lodash.merge — prototype pollution)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={pluginSettings}
                    onChange={(e) => setPluginSettings(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-danger">Install Plugin</button>
              </form>
              {pluginResult && (
                <pre className="mt-2 p-2 bg-dark text-success rounded small" style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(pluginResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Debug info */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Debug Info (env vars — A05)</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadDebug}>Load</button>
            </div>
            {dbInfo && (
              <div className="card-body">
                <pre className="small mb-0" style={{ maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(dbInfo.environment, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Directory listing */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Uploads Directory (A05)</h6>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadUploads}>Load</button>
            </div>
            {uploads && (
              <div className="card-body p-0">
                <table className="table table-sm mb-0">
                  <tbody>
                    {uploads.files.map((f) => (
                      <tr key={f.name}>
                        <td><a href={f.url}>{f.name}</a></td>
                        <td className="text-muted small">{(f.size / 1024).toFixed(1)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

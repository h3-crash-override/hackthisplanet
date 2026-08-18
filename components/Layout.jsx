import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function getTokenFromCookie() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function Layout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = getTokenFromCookie()
    if (token) setUser(parseJwt(token))
    else setUser(null)
  }, [router.asPath])

  function logout() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    setUser(null)
    router.push('/login')
  }

  return (
    <>
      <div
        style={{
          background: '#c0392b',
          color: '#fff',
          textAlign: 'center',
          padding: '8px 16px',
          fontWeight: 'bold',
          fontSize: '13px',
          letterSpacing: '0.3px',
        }}
      >
        WARNING: This application is intentionally vulnerable for security testing.
        Do NOT use real credentials or payment information.
      </div>

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold">
            NexusStore
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link href="/" className="nav-link">
                  Products
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/docs" className="nav-link">
                  API Docs
                </Link>
              </li>
            </ul>
            <ul className="navbar-nav">
              {user ? (
                <>
                  <li className="nav-item">
                    <Link href="/cart" className="nav-link">
                      Cart
                    </Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      data-bs-toggle="dropdown"
                      role="button"
                    >
                      {user.username}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <Link href={`/profile/${user.id}`} className="dropdown-item">
                          My Profile
                        </Link>
                      </li>
                      <li>
                        <Link href="/orders" className="dropdown-item">
                          My Orders
                        </Link>
                      </li>
                      {user.role === 'admin' && (
                        <li>
                          <Link href="/admin" className="dropdown-item">
                            Admin Panel
                          </Link>
                        </li>
                      )}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={logout}>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <Link href="/login" className="nav-link">
                      Login
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link href="/register" className="nav-link">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4">{children}</main>

      <footer className="bg-dark text-light text-center py-3 mt-5">
        <small>
          &copy; 2024 NexusStore &mdash; Built insecure by design &mdash;{' '}
          <Link href="/docs" className="text-light">
            API Docs
          </Link>
        </small>
      </footer>
    </>
  )
}

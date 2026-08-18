import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState(router.query.q || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = router.query.q || ''
    setSearch(q)
    setLoading(true)
    fetch(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router.query.q])

  function handleSearch(e) {
    e.preventDefault()
    router.push(`/?q=${encodeURIComponent(search)}`)
  }

  return (
    <>
      <div className="mb-4">
        <form onSubmit={handleSearch} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary px-4">
            Search
          </button>
        </form>
        {router.query.q && (
          <p className="mt-2 text-muted">
            Results for: <strong>{router.query.q}</strong>{' '}
            <Link href="/" className="text-decoration-none">
              clear
            </Link>
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-5 text-muted">No products found.</div>
      ) : (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
          {products.map((p) => (
            <div key={p.id} className="col">
              <div className="card h-100 shadow-sm">
                <img
                  src={p.image_url}
                  className="card-img-top"
                  alt={p.name}
                  style={{ height: 200, objectFit: 'cover' }}
                />
                <div className="card-body d-flex flex-column">
                  <span className="badge bg-secondary mb-1 align-self-start">{p.category}</span>
                  <h6 className="card-title">{p.name}</h6>
                  <p className="card-text text-muted small flex-grow-1">
                    {p.description?.slice(0, 80)}...
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <strong className="text-primary">${p.price}</strong>
                    <Link href={`/products/${p.id}`} className="btn btn-sm btn-outline-primary">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

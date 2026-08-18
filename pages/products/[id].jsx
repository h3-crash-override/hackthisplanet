import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}
function getUser() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return m ? parseJwt(decodeURIComponent(m[1])) : null
}

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState(null)
  const [review, setReview] = useState({ rating: 5, body: '' })
  const [cartMsg, setCartMsg] = useState('')
  const [reviewMsg, setReviewMsg] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then(setProduct)
  }, [id])

  async function addToCart() {
    const user = getUser()
    if (!user) return router.push('/login')
    await fetch(`/api/cart/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, quantity: 1 }),
    })
    setCartMsg('Added to cart!')
    setTimeout(() => setCartMsg(''), 2000)
  }

  async function submitReview(e) {
    e.preventDefault()
    const user = getUser()
    if (!user) return router.push('/login')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: product.id, ...review }),
    })
    if (res.ok) {
      setReviewMsg('Review submitted!')
      // Reload to show new review
      fetch(`/api/products/${id}`).then((r) => r.json()).then(setProduct)
      setReview({ rating: 5, body: '' })
    }
  }

  if (!product) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    )
  }

  if (product.error) {
    return <div className="alert alert-danger">{product.error}</div>
  }

  return (
    <>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/">Products</Link></li>
          <li className="breadcrumb-item active">{product.name}</li>
        </ol>
      </nav>

      <div className="row g-4 mb-5">
        <div className="col-md-5">
          <img
            src={product.image_url}
            alt={product.name}
            className="img-fluid rounded shadow-sm"
            style={{ width: '100%', maxHeight: 380, objectFit: 'cover' }}
          />
        </div>
        <div className="col-md-7">
          <span className="badge bg-secondary mb-2">{product.category}</span>
          <h2>{product.name}</h2>
          <h4 className="text-primary mb-3">${product.price}</h4>
          <p className="text-muted">{product.description}</p>
          <p className="text-muted small">In stock: {product.stock}</p>
          <button className="btn btn-primary btn-lg" onClick={addToCart}>
            Add to Cart
          </button>
          {cartMsg && <span className="ms-3 text-success fw-semibold">{cartMsg}</span>}
        </div>
      </div>

      <hr />
      <h5 className="mb-3">Customer Reviews ({(product.reviews || []).length})</h5>

      {(product.reviews || []).length === 0 ? (
        <p className="text-muted">No reviews yet. Be the first!</p>
      ) : (
        <div className="mb-4">
          {product.reviews.map((r) => (
            <div key={r.id} className="card mb-2">
              <div className="card-body py-2">
                <div className="d-flex justify-content-between">
                  <strong>{r.username}</strong>
                  <small className="text-warning">{'★'.repeat(r.rating || 0)}</small>
                </div>
                {/* dangerouslySetInnerHTML enables XSS - A03 */}
                <div
                  className="mt-1 text-muted small"
                  dangerouslySetInnerHTML={{ __html: r.body }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h6>Write a Review</h6>
          {reviewMsg && <div className="alert alert-success py-2">{reviewMsg}</div>}
          <form onSubmit={submitReview}>
            <div className="mb-2">
              <label className="form-label small">Rating</label>
              <select
                className="form-select form-select-sm w-auto"
                value={review.rating}
                onChange={(e) => setReview({ ...review, rating: e.target.value })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="form-label small">Review</label>
              <textarea
                className="form-control"
                rows={3}
                value={review.body}
                onChange={(e) => setReview({ ...review, body: e.target.value })}
                required
              />
              <div className="form-text">HTML is rendered directly (stored XSS possible).</div>
            </div>
            <button type="submit" className="btn btn-sm btn-primary">Submit Review</button>
          </form>
        </div>
      </div>
    </>
  )
}

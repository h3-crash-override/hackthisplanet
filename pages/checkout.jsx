import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

function getUser() {
  if (typeof document === 'undefined') return null
  try {
    const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (!m) return null
    return JSON.parse(atob(decodeURIComponent(m[1]).split('.')[1]))
  } catch { return null }
}

export default function Checkout() {
  const router = useRouter()
  const [form, setForm] = useState({ shipping_address: '', credit_card: '', coupon_code: '' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = typeof window !== 'undefined' ? getUser() : null

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch(`/api/cart/${user.id}`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
  }, [])

  const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
  const total = form.coupon_code === 'SAVE10' ? subtotal * 0.9 : subtotal

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/orders/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Order failed')
      } else {
        router.push(`/orders/${data.id}`)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h4 className="mb-4">Checkout</h4>
      <div className="row g-4">
        <div className="col-md-7">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <form onSubmit={placeOrder}>
                <h6 className="mb-3">Shipping Address</h6>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="123 Main St, City, State ZIP"
                    value={form.shipping_address}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                    required
                  />
                </div>

                <h6 className="mb-3">Payment</h6>
                <div className="mb-3">
                  <label className="form-label">Credit Card Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="4111 1111 1111 1111"
                    value={form.credit_card}
                    onChange={(e) => setForm({ ...form, credit_card: e.target.value })}
                    required
                  />
                  <div className="form-text text-danger">Stored in plaintext in the database (A02).</div>
                </div>

                <div className="mb-4">
                  <label className="form-label">Coupon Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="SAVE10"
                    value={form.coupon_code}
                    onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
                  />
                  <div className="form-text">Try SAVE10. No limit on applications per order (A04).</div>
                </div>

                <button type="submit" className="btn btn-success btn-lg w-100" disabled={loading}>
                  {loading ? 'Placing order...' : `Place Order — $${total.toFixed(2)}`}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="mb-3">Order Summary</h6>
              {items.map((item) => (
                <div key={item.product_id} className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">{item.name} × {item.quantity}</span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <hr />
              {form.coupon_code === 'SAVE10' && (
                <div className="d-flex justify-content-between text-success mb-1">
                  <span>Coupon SAVE10</span>
                  <span>-10%</span>
                </div>
              )}
              <div className="d-flex justify-content-between fw-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

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

export default function Cart() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const user = typeof window !== 'undefined' ? getUser() : null

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetch(`/api/cart/${user.id}`)
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  async function updateQty(productId, qty) {
    await fetch(`/api/cart/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: parseInt(qty) }),
    })
    fetch(`/api/cart/${user.id}`).then((r) => r.json()).then(setItems)
  }

  async function remove(productId) {
    await fetch(`/api/cart/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: 0 }),
    })
    setItems(items.filter((i) => i.product_id !== productId))
  }

  const total = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>

  return (
    <>
      <h4 className="mb-4">Shopping Cart</h4>
      {items.length === 0 ? (
        <div className="text-center py-5 text-muted">Your cart is empty.</div>
      ) : (
        <>
          <div className="table-responsive mb-3">
            <table className="table align-middle">
              <thead className="table-light">
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.product_id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img src={item.image_url} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>${item.price}</td>
                    <td>
                      {/* Accepts negative quantities - A04 */}
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: 80 }}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.product_id, e.target.value)}
                      />
                    </td>
                    <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(item.product_id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan={3} className="text-end">Total</td>
                  <td colSpan={2}>${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="d-flex justify-content-end">
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </>
  )
}

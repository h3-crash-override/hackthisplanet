import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

function getToken() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function OrderDetail() {
  const router = useRouter()
  const { id } = router.query
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (!id) return
    const token = getToken()
    if (!token) { router.push('/login'); return }
    // IDOR: fetches any order ID without ownership check - A01
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setOrder)
  }, [id])

  if (!order) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>

  if (order.error) return <div className="alert alert-danger">{order.error}</div>

  return (
    <>
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link href="/orders">My Orders</Link></li>
          <li className="breadcrumb-item active">Order #{order.id}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-md-8">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h6 className="mb-3">Order Items</h6>
              <table className="table table-sm">
                <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  {(order.items || []).filter(Boolean).map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm mb-3">
            <div className="card-body">
              <h6>Order Details</h6>
              <dl className="row mb-0 small">
                <dt className="col-5">Order #</dt><dd className="col-7">{order.id}</dd>
                <dt className="col-5">Status</dt>
                <dd className="col-7">
                  <span className={`badge bg-${order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}`}>
                    {order.status}
                  </span>
                </dd>
                <dt className="col-5">Total</dt><dd className="col-7">${parseFloat(order.total || 0).toFixed(2)}</dd>
                <dt className="col-5">Date</dt><dd className="col-7">{new Date(order.created_at).toLocaleDateString()}</dd>
                <dt className="col-5">Ship to</dt><dd className="col-7">{order.shipping_address}</dd>
                {/* Credit card returned in plaintext - A02 */}
                <dt className="col-5 text-danger">Card</dt>
                <dd className="col-7 text-danger fw-semibold">{order.credit_card}</dd>
              </dl>
              <div className="alert alert-warning py-1 mt-2 small mb-0">
                Credit card stored and returned in plaintext (A02).
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

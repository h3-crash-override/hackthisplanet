import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

function getToken() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function Orders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { router.push('/login'); return }
    fetch('/api/orders/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>

  return (
    <>
      <h4 className="mb-4">My Orders</h4>
      {orders.length === 0 ? (
        <div className="text-center py-5 text-muted">No orders yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>${parseFloat(o.total).toFixed(2)}</td>
                  <td>
                    <span className={`badge bg-${o.status === 'delivered' ? 'success' : o.status === 'shipped' ? 'info' : 'warning'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/orders/${o.id}`} className="btn btn-sm btn-outline-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

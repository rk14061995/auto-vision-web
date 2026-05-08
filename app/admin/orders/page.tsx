import { getAllPurchaseOrders } from "@/lib/db"
import { getAdminCountry, currencyForCountry } from "@/lib/admin-country"

export default async function OrdersPage() {
  const country = await getAdminCountry()
  const currency = currencyForCountry(country)
  const orders = await getAllPurchaseOrders(0, 500, currency)

  const paid = orders.filter((o) => o.status === "paid")
  const revenueINR = paid.filter((o) => o.currency === "INR").reduce((s, o) => s + o.finalAmount, 0)
  const revenueUSD = paid.filter((o) => o.currency === "USD").reduce((s, o) => s + o.finalAmount, 0)

  const STATUS_BADGE: Record<string, string> = {
    paid: "admin-badge-green",
    created: "admin-badge-blue",
    failed: "admin-badge-gray",
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders & Revenue</h1>
          <p className="admin-page-sub">
            All purchase orders and payment history
            {country && <span className="admin-badge admin-badge-blue" style={{ marginLeft: 8 }}>{country === "IN" ? "India" : "United States"}</span>}
          </p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Orders</div>
          <div className="admin-stat-value">{orders.length}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{paid.length} paid</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue (INR)</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>₹{revenueINR.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>paid orders only</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue (USD)</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>${revenueUSD.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>paid orders only</div>
        </div>
      </div>

      <div className="admin-table-card">
        {orders.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No orders yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Discounts</th>
                <th>Final</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={String(o._id)}>
                  <td>
                    <code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 5px", borderRadius: 4 }}>
                      {o.orderId.slice(0, 16)}…
                    </code>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{o.email}</td>
                  <td><span className="admin-badge admin-badge-blue">{o.planId}</span></td>
                  <td style={{ fontSize: 13 }}>
                    {o.currency === "USD" ? "$" : "₹"}{o.amount}
                  </td>
                  <td style={{ fontSize: 11, color: "#64748b" }}>
                    {o.couponCode && <span style={{ display: "block" }}>Coupon: -{o.couponDiscount}</span>}
                    {o.referralDiscount > 0 && <span style={{ display: "block" }}>Ref: -{o.referralDiscount}</span>}
                    {o.creditDiscount > 0 && <span style={{ display: "block" }}>Credit: -{o.creditDiscount}</span>}
                    {!o.couponCode && !o.referralDiscount && !o.creditDiscount && <span style={{ color: "#cbd5e1" }}>—</span>}
                  </td>
                  <td>
                    <strong style={{ color: o.status === "paid" ? "#059669" : undefined }}>
                      {o.currency === "USD" ? "$" : "₹"}{o.finalAmount}
                    </strong>
                  </td>
                  <td><span className={`admin-badge ${STATUS_BADGE[o.status] || "admin-badge-gray"}`}>{o.status}</span></td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

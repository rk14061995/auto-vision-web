import Link from "next/link"
import { notFound } from "next/navigation"
import { getUserRevenueDetail } from "@/lib/admin-revenue"
import type { PurchaseOrderKind } from "@/lib/db"

const STATUS_BADGE: Record<string, string> = {
  paid: "admin-badge-green",
  created: "admin-badge-blue",
  failed: "admin-badge-gray",
}

const KIND_LABEL: Record<PurchaseOrderKind, string> = {
  subscription: "Subscription",
  credit_pack: "Credit pack",
  ad: "Advertisement",
  marketplace: "Marketplace",
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}
function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US")}`
}

export default async function UserRevenueDetailPage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail)
  const detail = await getUserRevenueDetail(email)
  if (!detail.user && detail.orders.length === 0) {
    notFound()
  }

  const { user, totals, orders } = detail

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Revenue: {user?.name || email}</h1>
          <p className="admin-page-sub">{email}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/revenue" className="admin-btn admin-btn-secondary">
            ← Back to revenue
          </Link>
          <Link
            href={`/admin/users/${encodeURIComponent(email)}`}
            className="admin-btn admin-btn-secondary"
          >
            Insights
          </Link>
          <Link
            href={`/admin/referrals/${encodeURIComponent(email)}`}
            className="admin-btn admin-btn-primary"
          >
            Referral earnings
          </Link>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Plan</div>
          <div className="admin-stat-value" style={{ fontSize: 18 }}>
            {user?.planTier ?? "free"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {user?.billingCycle ?? "—"}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Paid orders</div>
          <div className="admin-stat-value">{totals.ordersPaid}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            of {totals.ordersTotal} total
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue (INR)</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>
            {formatINR(totals.revenueINR)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue (USD)</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>
            {formatUSD(totals.revenueUSD)}
          </div>
        </div>
      </div>

      <div className="admin-table-card" style={{ marginBottom: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Orders</th>
              <th>INR</th>
              <th>USD</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(totals.byKind) as PurchaseOrderKind[]).map((kind) => {
              const k = totals.byKind[kind]
              return (
                <tr key={kind}>
                  <td>
                    <span className="admin-badge admin-badge-purple">{KIND_LABEL[kind]}</span>
                  </td>
                  <td>{k.count}</td>
                  <td>{k.INR > 0 ? formatINR(k.INR) : "—"}</td>
                  <td>{k.USD > 0 ? formatUSD(k.USD) : "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
        Orders
      </h2>
      <div className="admin-table-card">
        {orders.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">No orders yet</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Kind</th>
                <th>Plan / Pack</th>
                <th>Provider</th>
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
                      {o.orderId.slice(0, 18)}…
                    </code>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-purple">
                      {KIND_LABEL[(o.kind ?? "subscription") as PurchaseOrderKind]}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {o.creditPackId ? (
                      <span>
                        {o.creditPackId}
                        {o.creditAmount ? (
                          <span style={{ color: "#64748b" }}> · {o.creditAmount} cr</span>
                        ) : null}
                      </span>
                    ) : (
                      <span>{o.planId}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{o.provider}</td>
                  <td style={{ fontSize: 13 }}>
                    {o.currency === "USD" ? "$" : "₹"}
                    {o.amount}
                  </td>
                  <td style={{ fontSize: 11, color: "#64748b" }}>
                    {o.couponCode && <span style={{ display: "block" }}>Coupon: -{o.couponDiscount}</span>}
                    {o.referralDiscount > 0 && <span style={{ display: "block" }}>Ref: -{o.referralDiscount}</span>}
                    {o.creditDiscount > 0 && <span style={{ display: "block" }}>Credit: -{o.creditDiscount}</span>}
                    {!o.couponCode && !o.referralDiscount && !o.creditDiscount && (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: o.status === "paid" ? "#059669" : undefined }}>
                      {o.currency === "USD" ? "$" : "₹"}
                      {o.finalAmount}
                    </strong>
                  </td>
                  <td>
                    <span className={`admin-badge ${STATUS_BADGE[o.status] || "admin-badge-gray"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

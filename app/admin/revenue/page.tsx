import Link from "next/link"
import { getRevenuePerUser } from "@/lib/admin-revenue"

const PAGE_SIZE = 50

type SortKey = "revenueINR" | "revenueUSD" | "ordersPaid" | "lastPaidAt"

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}
function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US")}`
}

export default async function RevenueByUserPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>
}) {
  const params = await searchParams
  const page = Math.max(parseInt(params.page || "1", 10), 1)
  const search = params.q?.trim() || undefined
  const sortRaw = params.sort || "revenueINR"
  const sortBy = (
    ["revenueINR", "revenueUSD", "ordersPaid", "lastPaidAt"] as SortKey[]
  ).includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "revenueINR"

  const { rows, totalUsers, totals } = await getRevenuePerUser({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    search,
    sortBy,
  })

  const totalPages = Math.max(Math.ceil(totalUsers / PAGE_SIZE), 1)

  const sortLabel: Record<SortKey, string> = {
    revenueINR: "Revenue (INR)",
    revenueUSD: "Revenue (USD)",
    ordersPaid: "Paid orders",
    lastPaidAt: "Last paid at",
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Revenue by user</h1>
          <p className="admin-page-sub">
            Per-user totals from paid <code>purchase_orders</code>, broken down by kind.
          </p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Paid orders</div>
          <div className="admin-stat-value">{totals.paidOrders.toLocaleString()}</div>
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
        <div className="admin-stat-card">
          <div className="admin-stat-label">Distinct paying users</div>
          <div className="admin-stat-value">{totalUsers.toLocaleString()}</div>
        </div>
      </div>

      <form
        method="get"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by email…"
          className="admin-form-input"
          style={{ minWidth: 260 }}
        />
        <select name="sort" defaultValue={sortBy} className="admin-form-select">
          {(Object.keys(sortLabel) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              Sort: {sortLabel[k]}
            </option>
          ))}
        </select>
        <button type="submit" className="admin-btn admin-btn-primary">
          Apply
        </button>
        {(search || sortBy !== "revenueINR") && (
          <Link href="/admin/revenue" className="admin-btn admin-btn-secondary">
            Reset
          </Link>
        )}
      </form>

      <div className="admin-table-card">
        {rows.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">No paying users found</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Orders</th>
                <th>Subscription</th>
                <th>Credit packs</th>
                <th>Ads</th>
                <th>Total INR</th>
                <th>Total USD</th>
                <th>Last paid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{r.email}</div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-blue">
                      {r.planTier ?? "free"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.ordersPaid}
                    <span style={{ color: "#94a3b8" }}> / {r.ordersTotal}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.subscriptionINR > 0 && <div>{formatINR(r.subscriptionINR)}</div>}
                    {r.subscriptionUSD > 0 && <div>{formatUSD(r.subscriptionUSD)}</div>}
                    {r.subscriptionINR === 0 && r.subscriptionUSD === 0 && (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.creditPackINR > 0 && <div>{formatINR(r.creditPackINR)}</div>}
                    {r.creditPackUSD > 0 && <div>{formatUSD(r.creditPackUSD)}</div>}
                    {r.creditPackINR === 0 && r.creditPackUSD === 0 && (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.adINR > 0 && <div>{formatINR(r.adINR)}</div>}
                    {r.adUSD > 0 && <div>{formatUSD(r.adUSD)}</div>}
                    {r.adINR === 0 && r.adUSD === 0 && (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td>
                    <strong style={{ color: r.revenueINR > 0 ? "#059669" : undefined }}>
                      {r.revenueINR > 0 ? formatINR(r.revenueINR) : "—"}
                    </strong>
                  </td>
                  <td>
                    <strong style={{ color: r.revenueUSD > 0 ? "#059669" : undefined }}>
                      {r.revenueUSD > 0 ? formatUSD(r.revenueUSD) : "—"}
                    </strong>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {r.lastPaidAt ? new Date(r.lastPaidAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <Link
                      href={`/admin/revenue/${encodeURIComponent(r.email)}`}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          {page > 1 && (
            <Link
              href={`/admin/revenue?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}&sort=${sortBy}`}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              ← Prev
            </Link>
          )}
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/revenue?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}&sort=${sortBy}`}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  )
}

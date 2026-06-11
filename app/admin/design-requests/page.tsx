import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllDesignRequests } from "@/lib/db"
import DesignRequestActions from "./DesignRequestActions"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim())

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "admin-badge-gray",
  paid:            "admin-badge-blue",
  in_progress:     "admin-badge-yellow",
  completed:       "admin-badge-green",
}

export default async function DesignRequestsPage() {
  const session = await auth()
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) redirect("/")

  const requests = await getAllDesignRequests()

  const pending = requests.filter((r) => r.status === "paid").length
  const inProgress = requests.filter((r) => r.status === "in_progress").length
  const completed = requests.filter((r) => r.status === "completed").length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Design Requests</h1>
          <p className="admin-page-sub">Ad creative briefs submitted by users</p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Awaiting work</div>
          <div className="admin-stat-value" style={{ color: pending > 0 ? "#f59e0b" : undefined }}>{pending}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">In Progress</div>
          <div className="admin-stat-value" style={{ color: "#3b82f6" }}>{inProgress}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Completed</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>{completed}</div>
        </div>
      </div>

      <div className="admin-table-card">
        {requests.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No design requests yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Format</th>
                <th>Colors</th>
                <th>Owner</th>
                <th>Copy</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={String(r._id)}>
                  <td>
                    <strong style={{ fontSize: 13 }}>{r.shopName}</strong>
                    {r.tagline && (
                      <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>{r.tagline}</span>
                    )}
                    {r.logoUrl && (
                      <img src={r.logoUrl} alt="logo" style={{ height: 24, marginTop: 4, objectFit: "contain" }} />
                    )}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-blue">{r.adType.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block", marginTop: 2, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.shopDescription}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {r.brandColors.map((c, i) => (
                        <span key={i} style={{ display: "inline-block", width: 20, height: 20, borderRadius: 4, background: c, border: "1px solid #e2e8f0" }} title={c} />
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{r.email}</td>
                  <td style={{ fontSize: 12, maxWidth: 180 }}>
                    {r.selectedCopy ? (
                      <div>
                        <strong>{r.selectedCopy.headline}</strong>
                        <span style={{ display: "block", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.selectedCopy.subtext}</span>
                        <span style={{ display: "inline-block", marginTop: 2, background: "#f1f5f9", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{r.selectedCopy.cta}</span>
                      </div>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <strong style={{ color: "#059669" }}>
                      {r.paymentCurrency === "USD" ? "$" : "₹"}{r.paymentAmount}
                    </strong>
                    <span style={{ display: "block", color: "#94a3b8", fontSize: 11 }}>{r.paymentId ? "paid" : "pending"}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${STATUS_BADGE[r.status] ?? "admin-badge-gray"}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    {r.resultImageUrl ? (
                      <a href={r.resultImageUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", fontSize: 12 }}>View</a>
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td>
                    <DesignRequestActions id={String(r._id)} status={r.status} />
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

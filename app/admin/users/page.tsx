import { getUsersList, getUsersCount } from "@/lib/db"
import UserActions from "./UserActions"

export default async function UsersPage() {
  const [users, total] = await Promise.all([getUsersList(0, 200), getUsersCount()])

  const PLAN_BADGE: Record<string, string> = {
    free: "admin-badge-gray",
    "1-project": "admin-badge-blue",
    "5-projects": "admin-badge-blue",
    "50-projects": "admin-badge-purple",
    "100-projects": "admin-badge-purple",
    business: "admin-badge-green",
    creator: "admin-badge-blue",
    pro: "admin-badge-purple",
    studio: "admin-badge-purple",
    enterprise: "admin-badge-green",
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-sub">{total} registered user{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="admin-table-card">
        {users.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No users yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Country</th>
                <th>Plan</th>
                <th>Projects</th>
                <th>Expiry</th>
                <th>Credits (INR/USD)</th>
                <th>Joined</th>
                <th>Insights</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const serialized = {
                  ...u,
                  _id: String(u._id),
                  subscriptionExpiry: u.subscriptionExpiry?.toISOString() ?? null,
                  createdAt: u.createdAt.toISOString(),
                }
                return (
                  <tr key={u.email}>
                    <td>
                      <strong style={{ fontSize: 13 }}>{u.name || "—"}</strong>
                      <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>{u.email}</span>
                    </td>
                    <td><span className="admin-badge admin-badge-gray">{u.country || "—"}</span></td>
                    <td>
                      <span className={`admin-badge ${PLAN_BADGE[u.planTier || u.planType] || PLAN_BADGE[u.planType] || "admin-badge-gray"}`}>
                        {u.planTier || u.planType}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <strong>{u.projectsUsed}</strong>
                      <span style={{ color: "#94a3b8" }}>/{u.projectLimit}</span>
                    </td>
                    <td style={{ fontSize: 12, color: u.subscriptionExpiry && new Date(u.subscriptionExpiry) < new Date() ? "#ef4444" : "#64748b" }}>
                      {u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ color: u.creditBalanceINR > 0 ? "#059669" : "#94a3b8" }}>₹{u.creditBalanceINR}</span>
                      {" / "}
                      <span style={{ color: u.creditBalanceUSD > 0 ? "#059669" : "#94a3b8" }}>${u.creditBalanceUSD}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <a
                        href={`/admin/users/${encodeURIComponent(u.email)}`}
                        className="admin-nav-link"
                        style={{ fontSize: 12 }}
                      >
                        Journey & projects
                      </a>
                    </td>
                    <td><UserActions user={serialized as any} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

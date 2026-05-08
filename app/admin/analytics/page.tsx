import {
  aggregatePopularCarMakes,
  aggregateUsageByType,
  getRecentUsageAcrossUsers,
} from "@/lib/admin-insights"

export const metadata = {
  title: "Analytics & interests — Admin",
}

export default async function AdminAnalyticsPage() {
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [events7, events30, carInterests, recent] = await Promise.all([
    aggregateUsageByType(since7),
    aggregateUsageByType(since30),
    aggregatePopularCarMakes(12),
    getRecentUsageAcrossUsers(35),
  ])

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics & interests</h1>
          <p className="admin-page-sub">
            Usage events (journey) and car-project signals (what people build with).
          </p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
        Data comes from the <code>usage_events</code> collection (checkout, AI, project
        opens, etc.) and <code>car_projects</code> (makes/models). Open a user from{" "}
        <a href="/admin/users" style={{ color: "#38bdf8" }}>All Users</a> →{" "}
        <strong>Insights</strong> for a full timeline and their projects.
      </p>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Event types (7 days)</div>
          <div className="admin-stat-value" style={{ fontSize: 18 }}>
            {events7.reduce((s, r) => s + r.count, 0)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Total events logged</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Event types (30 days)</div>
          <div className="admin-stat-value" style={{ fontSize: 18 }}>
            {events30.reduce((s, r) => s + r.count, 0)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>Total events logged</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div className="admin-table-card">
          <h2 className="admin-page-title" style={{ fontSize: 16, marginBottom: 12 }}>
            Journey — last 7 days (by type)
          </h2>
          {events7.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No usage events yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {events7.map((row) => (
                  <tr key={row.type}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{row.type}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="admin-table-card">
          <h2 className="admin-page-title" style={{ fontSize: 16, marginBottom: 12 }}>
            Journey — last 30 days (by type)
          </h2>
          {events30.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No usage events yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {events30.map((row) => (
                  <tr key={row.type}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{row.type}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="admin-table-card" style={{ marginBottom: 24 }}>
        <h2 className="admin-page-title" style={{ fontSize: 16, marginBottom: 12 }}>
          Interests — popular car makes (all projects)
        </h2>
        {carInterests.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>No projects yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Make</th>
                <th>Projects</th>
                <th>Unique owners</th>
              </tr>
            </thead>
            <tbody>
              {carInterests.map((row) => (
                <tr key={row.make}>
                  <td><strong>{row.make}</strong></td>
                  <td>{row.projectCount}</td>
                  <td>{row.uniqueOwners}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-table-card">
        <h2 className="admin-page-title" style={{ fontSize: 16, marginBottom: 12 }}>
          Live feed — recent activity (all users)
        </h2>
        {recent.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>No events yet.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Event</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <a
                      href={`/admin/users/${encodeURIComponent(row.email)}`}
                      style={{ color: "#38bdf8", fontSize: 12 }}
                    >
                      {row.email}
                    </a>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{row.type}</td>
                  <td style={{ fontSize: 11, color: "#94a3b8", maxWidth: 280, wordBreak: "break-all" }}>
                    {row.metadata && Object.keys(row.metadata).length
                      ? JSON.stringify(row.metadata)
                      : "—"}
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

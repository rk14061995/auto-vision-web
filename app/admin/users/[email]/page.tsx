import { notFound } from "next/navigation"
import Link from "next/link"
import {
  aggregateUsageTypesForUser,
  getUsageEventsForUser,
  getUserCarMakeInterests,
  getUserFeatureTouchesFromEvents,
  getUserForAdminInsights,
} from "@/lib/admin-insights"
import { getCarProjectsAdminCount, getCarProjectsAdminQuery } from "@/lib/db"

export const metadata = {
  title: "User insights — Admin",
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export default async function AdminUserInsightsPage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: raw } = await params
  const email = decodeURIComponent(raw)
  if (!isValidEmail(email)) notFound()

  const user = await getUserForAdminInsights(email)
  if (!user) notFound()

  const [journeySummary, carInterests, featureTouches, events, projectCount, projects] =
    await Promise.all([
      aggregateUsageTypesForUser(email),
      getUserCarMakeInterests(email),
      getUserFeatureTouchesFromEvents(email),
      getUsageEventsForUser(email, 80),
      getCarProjectsAdminCount(email),
      getCarProjectsAdminQuery({ ownerEmail: email, skip: 0, limit: 50 }),
    ])

  const metrics = user.usageMetrics

  return (
    <>
      <div className="admin-page-header">
        <div>
          <p style={{ marginBottom: 8 }}>
            <Link href="/admin/users" style={{ color: "#38bdf8", fontSize: 13 }}>
              ← All users
            </Link>
          </p>
          <h1 className="admin-page-title">{user.name || "User"}</h1>
          <p className="admin-page-sub">{email}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/admin/revenue/${encodeURIComponent(email)}`}
            className="admin-btn admin-btn-secondary"
          >
            Revenue
          </Link>
          <Link
            href={`/admin/referrals/${encodeURIComponent(email)}`}
            className="admin-btn admin-btn-secondary"
          >
            Referrals & payouts
          </Link>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Plan</div>
          <div className="admin-stat-value" style={{ fontSize: 16 }}>
            {user.planTier || user.planType}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Country</div>
          <div className="admin-stat-value" style={{ fontSize: 16 }}>{user.country || "—"}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Projects</div>
          <div className="admin-stat-value" style={{ fontSize: 16 }}>
            {user.projectsUsed}/{user.projectLimit === -1 ? "∞" : user.projectLimit}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Joined</div>
          <div className="admin-stat-value" style={{ fontSize: 14 }}>
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {metrics && (
        <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Projects created (counter)</div>
            <div className="admin-stat-value">{metrics.projectsCreated}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Exports</div>
            <div className="admin-stat-value">{metrics.exports}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">AI calls</div>
            <div className="admin-stat-value">{metrics.aiCalls}</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-label">Shares (30d field)</div>
            <div className="admin-stat-value">{metrics.sharesLastMonth}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="admin-table-card">
          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Interests — car makes</h2>
          {carInterests.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No projects yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Make</th>
                  <th>Projects</th>
                </tr>
              </thead>
              <tbody>
                {carInterests.map((r) => (
                  <tr key={r.make}>
                    <td>{r.make}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="admin-table-card">
          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Journey — event totals</h2>
          {journeySummary.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No usage events.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>#</th>
                </tr>
              </thead>
              <tbody>
                {journeySummary.map((r) => (
                  <tr key={r.type}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.type}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="admin-table-card">
          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Touches (AI / checkout)</h2>
          {featureTouches.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>No tagged metadata yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Signal</th>
                  <th>#</th>
                </tr>
              </thead>
              <tbody>
                {featureTouches.map((r) => (
                  <tr key={r.key}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.key}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="admin-table-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 className="admin-page-title" style={{ fontSize: 16, margin: 0 }}>
            Projects ({projectCount})
          </h2>
          <Link
            href={`/admin/projects?email=${encodeURIComponent(email)}`}
            style={{ color: "#38bdf8", fontSize: 13 }}
          >
            Open in Projects →
          </Link>
        </div>
        {projects.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>No car projects for this owner email.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Car</th>
                <th>Status</th>
                <th>Last active</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={String(p._id)}>
                  <td>
                    <strong style={{ fontSize: 13 }}>{p.projectName}</strong>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {p.carDetails.make} {p.carDetails.model}{" "}
                    <span style={{ color: "#94a3b8" }}>({p.carDetails.year})</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${p.status === "completed" ? "admin-badge-green" : "admin-badge-gray"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {new Date(p.lastAccessedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-table-card">
        <h2 className="admin-page-title" style={{ fontSize: 16, marginBottom: 12 }}>
          Journey timeline (latest {events.length} events)
        </h2>
        {events.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: 13 }}>No usage events for this user.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={String(ev._id)}>
                  <td style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                    {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{ev.type}</td>
                  <td style={{ fontSize: 11, color: "#94a3b8", wordBreak: "break-all" }}>
                    {ev.metadata && Object.keys(ev.metadata).length
                      ? JSON.stringify(ev.metadata)
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

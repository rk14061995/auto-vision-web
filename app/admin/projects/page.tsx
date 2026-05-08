import Link from "next/link"
import { getCarProjectsAdminCount, getCarProjectsAdminQuery } from "@/lib/db"

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email: ownerFilter } = await searchParams
  const ownerEmail = ownerFilter?.trim() || undefined

  const [projects, total] = await Promise.all([
    getCarProjectsAdminQuery({ ownerEmail, skip: 0, limit: 200 }),
    getCarProjectsAdminCount(ownerEmail),
  ])

  const drafts = projects.filter((p) => p.status === "draft").length
  const completed = projects.filter((p) => p.status === "completed").length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Projects</h1>
          <p className="admin-page-sub">
            {total} project{total !== 1 ? "s" : ""}
            {ownerEmail ? (
              <>
                {" "}
                for <strong>{ownerEmail}</strong>{" "}
                <Link href="/admin/projects" style={{ color: "#38bdf8", fontWeight: 400 }}>
                  (clear filter)
                </Link>
              </>
            ) : (
              " (all owners)"
            )}
          </p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">In view</div>
          <div className="admin-stat-value">{projects.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Completed</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>{completed}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Drafts</div>
          <div className="admin-stat-value" style={{ color: "#f59e0b" }}>{drafts}</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
        Filter by owner: add <code>?email=user@example.com</code> to the URL, or open{" "}
        <Link href="/admin/users" style={{ color: "#38bdf8" }}>Users</Link> →{" "}
        <strong>Journey & projects</strong> for a user, then use the Projects link.
      </p>

      <div className="admin-table-card">
        {projects.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No projects match</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Car</th>
                <th>Owner</th>
                <th>Team</th>
                <th>Modifications</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={String(p._id)}>
                  <td>
                    <strong style={{ fontSize: 13 }}>{p.projectName}</strong>
                    {p.description && <span style={{ fontSize: 11, color: "#94a3b8", display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</span>}
                  </td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{p.carDetails.make} {p.carDetails.model}</strong>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>{p.carDetails.year} · {p.carDetails.color}</span>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    <Link href={`/admin/users/${encodeURIComponent(p.email)}`} style={{ color: "#38bdf8" }}>
                      {p.email}
                    </Link>
                  </td>
                  <td style={{ fontSize: 11, color: "#94a3b8" }}>
                    {p.teamId ? String(p.teamId) : "—"}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-blue">
                      {Array.isArray(p.modifications) ? p.modifications.length : 0} items
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${p.status === "completed" ? "admin-badge-green" : "admin-badge-gray"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{new Date(p.lastAccessedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

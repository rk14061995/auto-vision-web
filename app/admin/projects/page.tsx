import { getAllCarProjects, getCarProjectsCount } from "@/lib/db"

export default async function ProjectsPage() {
  const [projects, total] = await Promise.all([getAllCarProjects(0, 200), getCarProjectsCount()])

  const drafts = projects.filter((p) => p.status === "draft").length
  const completed = projects.filter((p) => p.status === "completed").length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Projects</h1>
          <p className="admin-page-sub">{total} total car customization project{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total</div>
          <div className="admin-stat-value">{total}</div>
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

      <div className="admin-table-card">
        {projects.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No projects yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Car</th>
                <th>Owner</th>
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
                  <td style={{ fontSize: 12, color: "#64748b" }}>{p.email}</td>
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

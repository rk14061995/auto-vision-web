"use server"
import Link from "next/link"
import { getCarCatalogList, getAccessoriesList } from "@/lib/db"

export default async function AdminDashboardPage() {
  const [cars, accessories] = await Promise.all([
    getCarCatalogList(false),
    getAccessoriesList(false),
  ])

  const activeCars = cars.filter((c) => c.isActive).length
  const activeAcc = accessories.filter((a) => a.isActive).length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-sub">Manage car catalog, 3D models, accessories, and 2D images</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Car Models</div>
          <div className="admin-stat-value">{cars.length}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{activeCars} active</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Accessories</div>
          <div className="admin-stat-value">{accessories.length}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{activeAcc} active</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">2D Images</div>
          <div className="admin-stat-value">
            {cars.reduce((n, c) => n + (c.images2d?.length || 0), 0)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>across all cars</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="admin-table-card">
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 14 }}>Recent Car Models</strong>
            <Link href="/admin/car-models/new" className="admin-btn admin-btn-primary admin-btn-sm">+ Add Car</Link>
          </div>
          {cars.length === 0 ? (
            <div className="admin-empty"><p className="admin-empty-title">No car models yet</p></div>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Car</th><th>3D Model</th><th>Status</th></tr></thead>
              <tbody>
                {cars.slice(0, 8).map((car) => (
                  <tr key={String(car._id)}>
                    <td><Link href={`/admin/car-models/${car._id}`} style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>{car.make} {car.model}</Link><br /><span style={{ fontSize: 11, color: "#94a3b8" }}>{car.slug}</span></td>
                    <td><span style={{ fontSize: 11, color: car.model3dUrl ? "#059669" : "#94a3b8" }}>{car.model3dUrl ? "Uploaded" : "None"}</span></td>
                    <td><span className={`admin-badge ${car.isActive ? "admin-badge-green" : "admin-badge-gray"}`}>{car.isActive ? "Active" : "Draft"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-table-card">
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 14 }}>Recent Accessories</strong>
            <Link href="/admin/accessories/new" className="admin-btn admin-btn-primary admin-btn-sm">+ Add Accessory</Link>
          </div>
          {accessories.length === 0 ? (
            <div className="admin-empty"><p className="admin-empty-title">No accessories yet</p></div>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Category</th><th>Type</th></tr></thead>
              <tbody>
                {accessories.slice(0, 8).map((acc) => (
                  <tr key={String(acc._id)}>
                    <td><Link href={`/admin/accessories/${acc._id}`} style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>{acc.name}</Link></td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{acc.category}</td>
                    <td><span className={`admin-badge ${acc.accessoryType === "3d" ? "admin-badge-blue" : acc.accessoryType === "2d" ? "admin-badge-purple" : "admin-badge-green"}`}>{acc.accessoryType}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

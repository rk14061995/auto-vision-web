"use server"
import Link from "next/link"
import { getAccessoriesList } from "@/lib/db"

export default async function AccessoriesPage() {
  const accessories = await getAccessoriesList(false)

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Accessories</h1>
          <p className="admin-page-sub">Manage 3D accessories (GLTF/GLB) and 2D overlay images</p>
        </div>
        <Link href="/admin/accessories/new" className="admin-btn admin-btn-primary">+ Add Accessory</Link>
      </div>

      <div className="admin-table-card">
        {accessories.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">No accessories yet</p>
            <p style={{ fontSize: 13 }}>Add spoilers, bumpers, antennas and other parts.</p>
            <Link href="/admin/accessories/new" className="admin-btn admin-btn-primary" style={{ marginTop: 14, display: "inline-flex" }}>+ Add Accessory</Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 52 }}>Thumb</th>
                <th>Name</th>
                <th>Category</th>
                <th>Type</th>
                <th>3D Model</th>
                <th>2D Image</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessories.map((acc) => (
                <tr key={String(acc._id)}>
                  <td>
                    {acc.thumbnailUrl
                      ? <img src={acc.thumbnailUrl} alt="" className="admin-table-thumb" />
                      : <div className="admin-table-no-thumb">No img</div>}
                  </td>
                  <td><strong>{acc.name}</strong></td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{acc.category}</td>
                  <td>
                    <span className={`admin-badge ${acc.accessoryType === "3d" ? "admin-badge-blue" : acc.accessoryType === "2d" ? "admin-badge-purple" : "admin-badge-green"}`}>
                      {acc.accessoryType}
                    </span>
                  </td>
                  <td><span style={{ fontSize: 12, color: acc.model3dUrl ? "#059669" : "#94a3b8" }}>{acc.model3dUrl ? "Set" : "None"}</span></td>
                  <td><span style={{ fontSize: 12, color: acc.image2dUrl ? "#059669" : "#94a3b8" }}>{acc.image2dUrl ? "Set" : "None"}</span></td>
                  <td><span className={`admin-badge ${acc.isActive ? "admin-badge-green" : "admin-badge-gray"}`}>{acc.isActive ? "Active" : "Draft"}</span></td>
                  <td><Link href={`/admin/accessories/${acc._id}`} className="admin-btn admin-btn-secondary admin-btn-sm">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

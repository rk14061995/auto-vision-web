"use server"
import Link from "next/link"
import { getCarCatalogList } from "@/lib/db"

export default async function CarModelsPage() {
  const cars = await getCarCatalogList(false)

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Car Models</h1>
          <p className="admin-page-sub">Map 3D models and 2D images to each car make/model</p>
        </div>
        <Link href="/admin/car-models/new" className="admin-btn admin-btn-primary">+ Add Car Model</Link>
      </div>

      <div className="admin-table-card">
        {cars.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">No car models yet</p>
            <p style={{ fontSize: 13 }}>Add your first car model to start mapping 3D files and 2D images.</p>
            <Link href="/admin/car-models/new" className="admin-btn admin-btn-primary" style={{ marginTop: 14, display: "inline-flex" }}>+ Add Car Model</Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 52 }}>Thumb</th>
                <th>Make / Model</th>
                <th>Slug</th>
                <th>3D Model</th>
                <th>2D Images</th>
                <th>Accessories</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={String(car._id)}>
                  <td>
                    {car.thumbnailUrl
                      ? <img src={car.thumbnailUrl} alt="" className="admin-table-thumb" />
                      : <div className="admin-table-no-thumb">No img</div>}
                  </td>
                  <td>
                    <strong>{car.make} {car.model}</strong>
                    {car.year && <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>{car.year}</span>}
                  </td>
                  <td><code style={{ fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{car.slug}</code></td>
                  <td><span style={{ fontSize: 12, color: car.model3dUrl ? "#059669" : "#94a3b8", fontWeight: car.model3dUrl ? 600 : 400 }}>{car.model3dUrl ? "Uploaded" : "None"}</span></td>
                  <td><span className="admin-badge admin-badge-blue">{car.images2d?.length || 0} images</span></td>
                  <td><span className="admin-badge admin-badge-purple">{car.accessoryIds?.length || 0} linked</span></td>
                  <td><span className={`admin-badge ${car.isActive ? "admin-badge-green" : "admin-badge-gray"}`}>{car.isActive ? "Active" : "Draft"}</span></td>
                  <td>
                    <Link href={`/admin/car-models/${car._id}`} className="admin-btn admin-btn-secondary admin-btn-sm">Edit</Link>
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

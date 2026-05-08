import Link from "next/link"
import {
  getCarCatalogList,
  getAccessoriesList,
  getUsersCount,
  getCarProjectsCount,
  getAllAdvertisements,
  getAllPurchaseOrders,
  getDb,
  type Coupon,
} from "@/lib/db"
import SeedButton from "./SeedButton"

export default async function AdminDashboardPage() {
  const [cars, accessories, userCount, projectCount, ads, orders, coupons] = await Promise.all([
    getCarCatalogList(false),
    getAccessoriesList(false),
    getUsersCount(),
    getCarProjectsCount(),
    getAllAdvertisements(),
    getAllPurchaseOrders(0, 500),
    getDb().then((db) => db.collection<Coupon>("coupons").find({}).toArray()),
  ])

  const activeCars = cars.filter((c) => c.isActive).length
  const activeAcc = accessories.filter((a) => a.isActive).length
  const pendingAds = ads.filter((a) => a.status === "pending").length
  const paidOrders = orders.filter((o) => o.status === "paid")
  const revenueINR = paidOrders.filter((o) => o.currency === "INR").reduce((s, o) => s + o.finalAmount, 0)
  const revenueUSD = paidOrders.filter((o) => o.currency === "USD").reduce((s, o) => s + o.finalAmount, 0)
  const activeCoupons = coupons.filter((c) => c.isActive).length

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
          <p className="admin-page-sub">AutoVision Pro — manage catalog, users, ads, and revenue</p>
        </div>
        <SeedButton />
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
          <div className="admin-stat-label">Users</div>
          <div className="admin-stat-value">{userCount}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{projectCount} projects</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Advertisements</div>
          <div className="admin-stat-value" style={{ color: pendingAds > 0 ? "#f59e0b" : undefined }}>{ads.length}</div>
          <div style={{ fontSize: 12, color: pendingAds > 0 ? "#f59e0b" : "#64748b", marginTop: 4 }}>{pendingAds} pending review</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue INR</div>
          <div className="admin-stat-value" style={{ color: "#059669", fontSize: 22 }}>₹{revenueINR.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{paidOrders.length} paid orders</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Revenue USD</div>
          <div className="admin-stat-value" style={{ color: "#059669", fontSize: 22 }}>${revenueUSD.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{activeCoupons} active coupons</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 8 }}>
        <div className="admin-table-card">
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 14 }}>Car Models</strong>
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
                    <td>
                      <Link href={`/admin/car-models/${car._id}`} style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 600 }}>{car.make} {car.model}</Link>
                      <br /><span style={{ fontSize: 11, color: "#94a3b8" }}>{car.slug}</span>
                    </td>
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
            <strong style={{ fontSize: 14 }}>Accessories</strong>
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

        {pendingAds > 0 && (
          <div className="admin-table-card">
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 14 }}>Pending Ads ({pendingAds})</strong>
              <Link href="/admin/ads" className="admin-btn admin-btn-secondary admin-btn-sm">View all</Link>
            </div>
            <table className="admin-table">
              <thead><tr><th>Shop</th><th>Type</th><th>Owner</th></tr></thead>
              <tbody>
                {ads.filter((a) => a.status === "pending").slice(0, 5).map((ad) => (
                  <tr key={String(ad._id)}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{ad.shopName}</td>
                    <td><span className="admin-badge admin-badge-blue">{ad.adType}</span></td>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{ad.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="admin-table-card">
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong style={{ fontSize: 14 }}>Recent Orders</strong>
            <Link href="/admin/orders" className="admin-btn admin-btn-secondary admin-btn-sm">View all</Link>
          </div>
          {orders.length === 0 ? (
            <div className="admin-empty"><p className="admin-empty-title">No orders yet</p></div>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={String(o._id)}>
                    <td style={{ fontSize: 12, color: "#64748b" }}>{o.email}</td>
                    <td><span className="admin-badge admin-badge-blue">{o.planId}</span></td>
                    <td style={{ fontWeight: 600 }}>{o.currency === "USD" ? "$" : "₹"}{o.finalAmount}</td>
                    <td><span className={`admin-badge ${o.status === "paid" ? "admin-badge-green" : "admin-badge-gray"}`}>{o.status}</span></td>
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

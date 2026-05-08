import { getAllAdvertisements } from "@/lib/db"
import AdActions from "./AdActions"

export default async function AdsPage() {
  const ads = await getAllAdvertisements()

  const pending = ads.filter((a) => a.status === "pending").length
  const active = ads.filter((a) => a.status === "active").length
  const expired = ads.filter((a) => a.status === "expired").length

  const STATUS_BADGE: Record<string, string> = {
    active: "admin-badge-green",
    pending: "admin-badge-blue",
    expired: "admin-badge-gray",
  }

  const TYPE_LABEL: Record<string, string> = {
    banner: "Banner",
    horizontal: "Horizontal",
    square: "Square",
    video: "Video",
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Advertisements</h1>
          <p className="admin-page-sub">Review and approve user-submitted ads</p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Pending Review</div>
          <div className="admin-stat-value" style={{ color: pending > 0 ? "#f59e0b" : undefined }}>{pending}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Active</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>{active}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Expired</div>
          <div className="admin-stat-value" style={{ color: "#94a3b8" }}>{expired}</div>
        </div>
      </div>

      <div className="admin-table-card">
        {ads.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No advertisements yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Shop</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Period</th>
                <th>Views / Clicks</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={String(ad._id)}>
                  <td>
                    {ad.images?.[0]
                      ? <img src={ad.images[0]} alt="" className="admin-table-thumb" style={{ width: 60, height: 40, objectFit: "cover" }} />
                      : <div className="admin-table-no-thumb" style={{ width: 60, height: 40 }}>—</div>}
                  </td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{ad.shopName}</strong>
                    <span style={{ fontSize: 11, color: "#64748b", display: "block", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.shopDescription}</span>
                  </td>
                  <td><span className="admin-badge admin-badge-blue">{TYPE_LABEL[ad.adType] || ad.adType}</span></td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{ad.email}</td>
                  <td style={{ fontSize: 11, color: "#64748b" }}>
                    {new Date(ad.startDate).toLocaleDateString()}
                    <span style={{ display: "block" }}>→ {new Date(ad.endDate).toLocaleDateString()}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <strong>{ad.views}</strong> <span style={{ color: "#94a3b8" }}>views</span>
                    <span style={{ display: "block" }}><strong>{ad.clicks}</strong> <span style={{ color: "#94a3b8" }}>clicks</span></span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <strong style={{ color: "#059669" }}>
                      {ad.paymentCurrency === "USD" ? "$" : "₹"}{ad.paymentAmount}
                    </strong>
                  </td>
                  <td><span className={`admin-badge ${STATUS_BADGE[ad.status] || "admin-badge-gray"}`}>{ad.status}</span></td>
                  <td><AdActions id={String(ad._id)} status={ad.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

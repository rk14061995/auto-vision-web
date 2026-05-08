"use client"

import { useState } from "react"
import type { MarketplaceAsset, MarketplaceAssetStatus } from "@/lib/db"

interface Props {
  initialAssets: MarketplaceAsset[]
}

export function MarketplaceModeration({ initialAssets }: Props) {
  const [assets, setAssets] = useState(initialAssets)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function setStatus(id: string, status: MarketplaceAssetStatus) {
    setBusyId(id)
    try {
      let reason: string | undefined
      if (status === "rejected") {
        reason = window.prompt("Reason (visible to creator):") ?? undefined
        if (!reason) {
          setBusyId(null)
          return
        }
      }
      const res = await fetch("/api/admin/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setAssets((current) =>
        current.map((a) => (String(a._id) === id ? json.asset : a)),
      )
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Creator</th>
            <th>Status</th>
            <th>Premium</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const id = String(asset._id)
            return (
              <tr key={id}>
                <td>
                  <a href={asset.thumbnailUrl} target="_blank" rel="noreferrer">
                    {asset.title}
                  </a>
                </td>
                <td>{asset.type}</td>
                <td>{asset.creatorEmail}</td>
                <td>
                  <span className={`admin-pill admin-pill-${asset.status}`}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.premium ? "Yes" : "No"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      disabled={busyId === id || asset.status === "approved"}
                      onClick={() => setStatus(id, "approved")}
                      className="admin-btn admin-btn-primary"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === id || asset.status === "rejected"}
                      onClick={() => setStatus(id, "rejected")}
                      className="admin-btn admin-btn-danger"
                    >
                      Reject
                    </button>
                    <button
                      disabled={busyId === id || asset.status === "archived"}
                      onClick={() => setStatus(id, "archived")}
                      className="admin-btn"
                    >
                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

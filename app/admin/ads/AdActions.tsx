"use client"

import { useState } from "react"

type AdStatus = "active" | "expired" | "pending"

export default function AdActions({ id, status: initial }: { id: string; status: AdStatus }) {
  const [status, setStatus] = useState<AdStatus>(initial)
  const [loading, setLoading] = useState(false)

  async function setAdStatus(next: AdStatus) {
    setLoading(true)
    const res = await fetch(`/api/admin/ads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) setStatus(next)
    setLoading(false)
  }

  async function deleteAd() {
    if (!confirm("Delete this advertisement?")) return
    setLoading(true)
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE" })
    window.location.reload()
  }

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {status !== "active" && (
        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setAdStatus("active")} disabled={loading}>Approve</button>
      )}
      {status === "active" && (
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAdStatus("expired")} disabled={loading}>Expire</button>
      )}
      {status === "pending" && (
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setAdStatus("expired")} disabled={loading}>Reject</button>
      )}
      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={deleteAd} disabled={loading}>Del</button>
    </div>
  )
}

"use client"

import { useState } from "react"

export default function SeedButton() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function seed() {
    if (!confirm("Insert sample US car models and accessories? (Only inserts if collections are empty)")) return
    setLoading(true)
    const res = await fetch("/api/admin/seed", { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      const parts = []
      if (data.insertedCars > 0) parts.push(`${data.insertedCars} cars`)
      if (data.insertedAccessories > 0) parts.push(`${data.insertedAccessories} accessories`)
      if (data.skippedCars) parts.push("cars skipped (existing data)")
      if (data.skippedAccessories) parts.push("accessories skipped (existing data)")
      setMsg(parts.join(", ") || "Nothing inserted")
    } else {
      setMsg("Seed failed")
    }
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {msg && <span style={{ fontSize: 12, color: "#059669" }}>{msg}</span>}
      <button className="admin-btn admin-btn-secondary" onClick={seed} disabled={loading} style={{ fontSize: 12 }}>
        {loading ? "Seeding…" : "Seed US Sample Data"}
      </button>
    </div>
  )
}

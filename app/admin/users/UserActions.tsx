"use client"

import { useState } from "react"

interface User {
  _id: string
  email: string
  name: string
  country: string | null
  planType: string
  projectLimit: number
  projectsUsed: number
  subscriptionExpiry: string | null
  creditBalanceINR: number
  creditBalanceUSD: number
  createdAt: string
}

export default function UserActions({ user }: { user: User }) {
  const [plan, setPlan] = useState(user.planType)
  const [limit, setLimit] = useState(String(user.projectLimit))
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/admin/users/${encodeURIComponent(user.email)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planType: plan, projectLimit: Number(limit) }),
    })
    setSaving(false)
    setOpen(false)
  }

  if (!open) {
    return (
      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setOpen(true)}>Edit Plan</button>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
      <select className="admin-form-select" style={{ padding: "4px 6px", fontSize: 12 }} value={plan} onChange={(e) => setPlan(e.target.value)}>
        <option value="free">Free</option>
        <option value="1-project">1 Project</option>
        <option value="5-projects">5 Projects</option>
        <option value="50-projects">50 Projects</option>
        <option value="100-projects">100 Projects</option>
        <option value="business">Business</option>
      </select>
      <input className="admin-form-input" style={{ padding: "4px 6px", fontSize: 12 }} type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Project limit" />
      <div style={{ display: "flex", gap: 4 }}>
        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={save} disabled={saving}>{saving ? "…" : "Save"}</button>
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  )
}

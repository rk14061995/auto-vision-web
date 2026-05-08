"use client"

import { useState } from "react"

interface Coupon {
  _id: string
  code: string
  isActive: boolean
  discountType: "percent" | "flat"
  discountValue: number
  currency: "INR" | "USD" | "ANY"
  minAmount?: number
  maxUses?: number
  perUserLimit?: number
  startsAt?: string
  expiresAt?: string
  usedCount: number
  createdAt: string
}

const EMPTY_FORM = {
  code: "",
  discountType: "percent" as "percent" | "flat",
  discountValue: 10,
  currency: "ANY" as "INR" | "USD" | "ANY",
  minAmount: "",
  maxUses: "",
  perUserLimit: "",
  startsAt: "",
  expiresAt: "",
}

export default function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function fv(k: keyof typeof EMPTY_FORM, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")
    const body = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      currency: form.currency,
      ...(form.minAmount ? { minAmount: Number(form.minAmount) } : {}),
      ...(form.maxUses ? { maxUses: Number(form.maxUses) } : {}),
      ...(form.perUserLimit ? { perUserLimit: Number(form.perUserLimit) } : {}),
      ...(form.startsAt ? { startsAt: form.startsAt } : {}),
      ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
    }
    const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) {
      const created = await res.json()
      setCoupons((prev) => [created, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      setSuccess(`Coupon ${created.code} created`)
    } else {
      const { error: msg } = await res.json()
      setError(msg || "Failed to create coupon")
    }
    setSaving(false)
  }

  async function toggleActive(coupon: Coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setCoupons((prev) => prev.map((c) => (c.code === updated.code ? updated : c)))
    }
  }

  async function handleDelete(code: string) {
    if (!confirm(`Delete coupon ${code}?`)) return
    const res = await fetch(`/api/admin/coupons/${code}`, { method: "DELETE" })
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.code !== code))
      setSuccess(`Coupon ${code} deleted`)
    }
  }

  return (
    <>
      {success && <div className="admin-form-success" style={{ marginBottom: 16 }}>{success}</div>}
      {error && <div className="admin-form-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-table-card">
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <strong style={{ fontSize: 14 }}>{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</strong>
          <button className="admin-btn admin-btn-primary" onClick={() => { setShowForm((v) => !v); setError("") }}>
            {showForm ? "Cancel" : "+ New Coupon"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={{ padding: "20px 18px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div className="admin-form-grid" style={{ marginBottom: 12 }}>
              <div className="admin-form-field">
                <label className="admin-form-label">Code *</label>
                <input className="admin-form-input" required value={form.code} onChange={(e) => fv("code", e.target.value.toUpperCase())} placeholder="SAVE20" />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Discount Type *</label>
                <select className="admin-form-select" value={form.discountType} onChange={(e) => fv("discountType", e.target.value as any)}>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat amount</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Value *</label>
                <input className="admin-form-input" type="number" required min={0} value={form.discountValue} onChange={(e) => fv("discountValue", e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Currency</label>
                <select className="admin-form-select" value={form.currency} onChange={(e) => fv("currency", e.target.value as any)}>
                  <option value="ANY">Any</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Min Order Amount</label>
                <input className="admin-form-input" type="number" min={0} placeholder="Optional" value={form.minAmount} onChange={(e) => fv("minAmount", e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Max Uses</label>
                <input className="admin-form-input" type="number" min={1} placeholder="Unlimited" value={form.maxUses} onChange={(e) => fv("maxUses", e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Per-user Limit</label>
                <input className="admin-form-input" type="number" min={1} placeholder="Unlimited" value={form.perUserLimit} onChange={(e) => fv("perUserLimit", e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Starts At</label>
                <input className="admin-form-input" type="datetime-local" value={form.startsAt} onChange={(e) => fv("startsAt", e.target.value)} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Expires At</label>
                <input className="admin-form-input" type="datetime-local" value={form.expiresAt} onChange={(e) => fv("expiresAt", e.target.value)} />
              </div>
            </div>
            <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create Coupon"}
            </button>
          </form>
        )}

        {coupons.length === 0 ? (
          <div className="admin-empty"><p className="admin-empty-title">No coupons yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Currency</th>
                <th>Limits</th>
                <th>Used</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code}>
                  <td><code style={{ fontWeight: 700, fontSize: 13, background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>{c.code}</code></td>
                  <td>
                    <strong style={{ color: "#059669" }}>
                      {c.discountType === "percent" ? `${c.discountValue}%` : `${c.discountValue} flat`}
                    </strong>
                    {c.minAmount ? <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>min {c.minAmount}</span> : null}
                  </td>
                  <td><span className="admin-badge admin-badge-blue">{c.currency}</span></td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {c.maxUses ? `${c.usedCount}/${c.maxUses}` : "∞"}
                    {c.perUserLimit ? <span style={{ display: "block" }}>{c.perUserLimit}/user</span> : null}
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.usedCount}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td>
                    <span className={`admin-badge ${c.isActive ? "admin-badge-green" : "admin-badge-gray"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className={`admin-btn admin-btn-sm ${c.isActive ? "admin-btn-secondary" : "admin-btn-primary"}`} onClick={() => toggleActive(c)}>
                      {c.isActive ? "Disable" : "Enable"}
                    </button>
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(c.code)}>Del</button>
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

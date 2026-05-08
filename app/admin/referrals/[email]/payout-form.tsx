"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface UnpaidReward {
  id: string
  referredEmail: string
  orderId: string
  amount: number
  currency: "INR" | "USD"
  createdAt: Date | string
}

interface PayoutFormProps {
  referrerEmail: string
  pendingINR: number
  pendingUSD: number
  unpaidRewards: UnpaidReward[]
}

const METHODS = ["manual", "bank", "upi", "paypal", "credit_topup", "other"] as const

export default function PayoutForm({
  referrerEmail,
  pendingINR,
  pendingUSD,
  unpaidRewards,
}: PayoutFormProps) {
  const router = useRouter()
  const [currency, setCurrency] = useState<"INR" | "USD">(pendingINR >= pendingUSD ? "INR" : "USD")
  const [amount, setAmount] = useState<string>(
    String(currency === "INR" ? pendingINR : pendingUSD || ""),
  )
  const [method, setMethod] = useState<(typeof METHODS)[number]>("manual")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filteredRewards = unpaidRewards.filter((r) => r.currency === currency)

  function toggleAll() {
    if (selectedIds.size === filteredRewards.length) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(filteredRewards.map((r) => r.id)))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Amount must be a positive number")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/referrals/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerEmail,
          amount: parsed,
          currency,
          method,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          rewardIdsCovered: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record payout")

      setSuccess("Payout recorded.")
      setAmount("")
      setReference("")
      setNotes("")
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payout")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTotal = filteredRewards
    .filter((r) => selectedIds.has(r.id))
    .reduce((s, r) => s + r.amount, 0)

  return (
    <form onSubmit={handleSubmit} className="admin-form-card" style={{ padding: 20, maxWidth: "100%" }}>
      {error && <div className="admin-form-error">{error}</div>}
      {success && <div className="admin-form-success">{success}</div>}

      <div className="admin-form-section">
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label className="admin-form-label">Currency</label>
            <select
              value={currency}
              onChange={(e) => {
                const c = e.target.value as "INR" | "USD"
                setCurrency(c)
                setSelectedIds(new Set())
                setAmount(String(c === "INR" ? pendingINR : pendingUSD || ""))
              }}
              className="admin-form-select"
            >
              <option value="INR">INR (₹{pendingINR.toLocaleString("en-IN")} pending)</option>
              <option value="USD">USD (${pendingUSD.toLocaleString("en-US")} pending)</option>
            </select>
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="admin-form-input"
              required
            />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
              className="admin-form-select"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Reference</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Txn id, UPI ref, etc."
              className="admin-form-input"
            />
          </div>
          <div className="admin-form-field full">
            <label className="admin-form-label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="admin-form-textarea"
              rows={2}
            />
          </div>
        </div>
      </div>

      {filteredRewards.length > 0 && (
        <div className="admin-form-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <p className="admin-form-section-title" style={{ margin: 0, border: "none", paddingBottom: 0 }}>
              Cover specific reward rows ({currency})
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              {selectedIds.size === filteredRewards.length ? "Clear" : "Select all"}
            </button>
          </div>
          <div
            style={{
              maxHeight: 200,
              overflowY: "auto",
              border: "1px solid #e2e8f0",
              borderRadius: 7,
              padding: 8,
              fontSize: 12,
            }}
          >
            {filteredRewards.map((r) => (
              <label
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 6px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={() => toggleOne(r.id)}
                />
                <span style={{ flex: 1 }}>{r.referredEmail}</span>
                <code
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    background: "#f1f5f9",
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  {r.orderId.slice(0, 12)}…
                </code>
                <strong style={{ minWidth: 70, textAlign: "right" }}>
                  {currency === "INR" ? "₹" : "$"}
                  {r.amount}
                </strong>
              </label>
            ))}
          </div>
          {selectedIds.size > 0 && (
            <p className="admin-form-hint" style={{ marginTop: 6 }}>
              {selectedIds.size} selected · total {currency === "INR" ? "₹" : "$"}
              {selectedTotal}
            </p>
          )}
        </div>
      )}

      <div className="admin-form-actions">
        <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary">
          {submitting ? "Recording…" : "Record payout"}
        </button>
      </div>
    </form>
  )
}

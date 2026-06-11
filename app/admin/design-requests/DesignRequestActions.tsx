"use client"

import { useState } from "react"

interface Props {
  id: string
  status: string
}

export default function DesignRequestActions({ id, status }: Props) {
  const [current, setCurrent] = useState(status)
  const [resultUrl, setResultUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDeliver, setShowDeliver] = useState(false)

  async function updateStatus(newStatus: string, resultImageUrl?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/design-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...(resultImageUrl && { resultImageUrl }) }),
      })
      if (!res.ok) throw new Error("Update failed")
      setCurrent(newStatus)
      setShowDeliver(false)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (current === "completed") {
    return <span style={{ fontSize: 12, color: "#059669" }}>✓ Delivered</span>
  }

  if (current === "pending_payment") {
    return <span style={{ fontSize: 12, color: "#94a3b8" }}>Awaiting payment</span>
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {current === "paid" && (
        <button
          onClick={() => updateStatus("in_progress")}
          disabled={loading}
          style={{
            padding: "3px 8px", borderRadius: 6, border: "1px solid #3b82f6",
            color: "#3b82f6", background: "transparent", cursor: "pointer", fontSize: 12,
          }}
        >
          {loading ? "..." : "Start work"}
        </button>
      )}

      {current === "in_progress" && !showDeliver && (
        <button
          onClick={() => setShowDeliver(true)}
          style={{
            padding: "3px 8px", borderRadius: 6, border: "1px solid #059669",
            color: "#059669", background: "transparent", cursor: "pointer", fontSize: 12,
          }}
        >
          Deliver result
        </button>
      )}

      {showDeliver && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <input
            type="url"
            placeholder="Cloudinary / CDN URL"
            value={resultUrl}
            onChange={(e) => setResultUrl(e.target.value)}
            style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid #e2e8f0", width: 180 }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => updateStatus("completed", resultUrl)}
              disabled={loading || !resultUrl}
              style={{
                padding: "3px 8px", borderRadius: 6, background: "#059669",
                color: "white", border: "none", cursor: "pointer", fontSize: 11,
              }}
            >
              {loading ? "..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowDeliver(false)}
              style={{
                padding: "3px 8px", borderRadius: 6, background: "transparent",
                color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 11,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

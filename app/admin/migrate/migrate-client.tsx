"use client"

import { useState } from "react"

interface MigrationResult {
  total: number
  migrated: number
  skipped: number
  results: { email: string; fromPlan: string; toTier: string; projectLimit: number; monthlyAiGranted: number }[]
}

export function MigrateClient() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/migrate-plans", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Migration failed")
      setResult(json)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-card">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="admin-btn admin-btn-primary"
      >
        {busy ? "Migrating..." : "Run migration"}
      </button>
      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16 }}>
          <p>
            <strong>Total:</strong> {result.total} • <strong>Migrated:</strong>{" "}
            {result.migrated} • <strong>Skipped:</strong> {result.skipped}
          </p>
          {result.results.length > 0 && (
            <div className="admin-table-wrap" style={{ marginTop: 16 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Project Limit</th>
                    <th>AI Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr key={r.email}>
                      <td>{r.email}</td>
                      <td>{r.fromPlan}</td>
                      <td>{r.toTier}</td>
                      <td>{r.projectLimit === -1 ? "∞" : r.projectLimit}</td>
                      <td>{r.monthlyAiGranted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

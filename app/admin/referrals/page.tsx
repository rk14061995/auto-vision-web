import Link from "next/link"
import { getReferrerLeaderboard } from "@/lib/admin-revenue"

const PAGE_SIZE = 50

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}
function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US")}`
}

export default async function ReferrersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Math.max(parseInt(params.page || "1", 10), 1)
  const search = params.q?.trim() || undefined

  const rows = await getReferrerLeaderboard({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    search,
  })

  const totals = rows.reduce(
    (acc, r) => {
      acc.referredCount += r.referredCount
      acc.earnedINR += r.earnedINR
      acc.earnedUSD += r.earnedUSD
      acc.paidOutINR += r.paidOutINR
      acc.paidOutUSD += r.paidOutUSD
      acc.pendingINR += r.pendingINR
      acc.pendingUSD += r.pendingUSD
      return acc
    },
    {
      referredCount: 0,
      earnedINR: 0,
      earnedUSD: 0,
      paidOutINR: 0,
      paidOutUSD: 0,
      pendingINR: 0,
      pendingUSD: 0,
    },
  )

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Referrers & payouts</h1>
          <p className="admin-page-sub">
            Who is referring the most and how much they have earned. Click into a row to log a payout.
          </p>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 16 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Referred users (page)</div>
          <div className="admin-stat-value">{totals.referredCount.toLocaleString()}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Earned (INR)</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>
            {formatINR(totals.earnedINR)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            paid out {formatINR(totals.paidOutINR)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Earned (USD)</div>
          <div className="admin-stat-value" style={{ color: "#059669" }}>
            {formatUSD(totals.earnedUSD)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            paid out {formatUSD(totals.paidOutUSD)}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Pending payouts</div>
          <div className="admin-stat-value" style={{ color: "#dc2626" }}>
            {formatINR(totals.pendingINR)}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {formatUSD(totals.pendingUSD)}
          </div>
        </div>
      </div>

      <form method="get" style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search referrer by email or name…"
          className="admin-form-input"
          style={{ minWidth: 280 }}
        />
        <button type="submit" className="admin-btn admin-btn-primary">
          Search
        </button>
        {search && (
          <Link href="/admin/referrals" className="admin-btn admin-btn-secondary">
            Reset
          </Link>
        )}
      </form>

      <div className="admin-table-card">
        {rows.length === 0 ? (
          <div className="admin-empty">
            <p className="admin-empty-title">No referrers yet</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Referrer</th>
                <th>Code</th>
                <th>Referred</th>
                <th>Earned</th>
                <th>Paid out</th>
                <th>Pending</th>
                <th>Last reward</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.email}>
                  <td style={{ fontWeight: 700, color: "#0f172a" }}>
                    #{(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{r.email}</div>
                  </td>
                  <td>
                    {r.referralCode ? (
                      <code
                        style={{
                          fontSize: 11,
                          background: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {r.referralCode}
                      </code>
                    ) : (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-blue">{r.referredCount}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.earnedINR > 0 && <div>{formatINR(r.earnedINR)}</div>}
                    {r.earnedUSD > 0 && <div>{formatUSD(r.earnedUSD)}</div>}
                    {r.earnedINR === 0 && r.earnedUSD === 0 && (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.paidOutINR > 0 && <div>{formatINR(r.paidOutINR)}</div>}
                    {r.paidOutUSD > 0 && <div>{formatUSD(r.paidOutUSD)}</div>}
                    {r.paidOutINR === 0 && r.paidOutUSD === 0 && (
                      <span style={{ color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.pendingINR > 0 && (
                      <div style={{ color: "#dc2626", fontWeight: 600 }}>
                        {formatINR(r.pendingINR)}
                      </div>
                    )}
                    {r.pendingUSD > 0 && (
                      <div style={{ color: "#dc2626", fontWeight: 600 }}>
                        {formatUSD(r.pendingUSD)}
                      </div>
                    )}
                    {r.pendingINR === 0 && r.pendingUSD === 0 && (
                      <span style={{ color: "#94a3b8" }}>settled</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>
                    {r.lastRewardAt
                      ? new Date(r.lastRewardAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <Link
                      href={`/admin/referrals/${encodeURIComponent(r.email)}`}
                      className="admin-btn admin-btn-primary admin-btn-sm"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length === PAGE_SIZE && (
        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          {page > 1 && (
            <Link
              href={`/admin/referrals?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              className="admin-btn admin-btn-secondary admin-btn-sm"
            >
              ← Prev
            </Link>
          )}
          <span style={{ fontSize: 12, color: "#64748b" }}>Page {page}</span>
          <Link
            href={`/admin/referrals?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
            className="admin-btn admin-btn-secondary admin-btn-sm"
          >
            Next →
          </Link>
        </div>
      )}
    </>
  )
}

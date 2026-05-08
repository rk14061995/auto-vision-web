import Link from "next/link"
import { notFound } from "next/navigation"
import { getReferrerDetail } from "@/lib/admin-revenue"
import PayoutForm from "./payout-form"

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`
}
function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US")}`
}

export default async function ReferrerDetailPage({
  params,
}: {
  params: Promise<{ email: string }>
}) {
  const { email: rawEmail } = await params
  const email = decodeURIComponent(rawEmail)
  const detail = await getReferrerDetail(email)
  if (!detail.user && detail.rewards.length === 0 && detail.referredUsers.length === 0) {
    notFound()
  }

  const { user, totals, rewards, payouts, referredUsers } = detail
  const unpaidRewards = rewards.filter((r) => !r.paidOutAt)

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{user?.name || email}</h1>
          <p className="admin-page-sub">
            Referral earnings and payout history
            {totals.referralCode ? (
              <>
                {" "}
                · code{" "}
                <code
                  style={{
                    fontSize: 11,
                    background: "#f1f5f9",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {totals.referralCode}
                </code>
              </>
            ) : null}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/referrals" className="admin-btn admin-btn-secondary">
            ← Back
          </Link>
          <Link
            href={`/admin/users/${encodeURIComponent(email)}`}
            className="admin-btn admin-btn-secondary"
          >
            Insights
          </Link>
          <Link
            href={`/admin/revenue/${encodeURIComponent(email)}`}
            className="admin-btn admin-btn-secondary"
          >
            Revenue
          </Link>
        </div>
      </div>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Referred users</div>
          <div className="admin-stat-value">{totals.referredCount}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Earned</div>
          <div className="admin-stat-value" style={{ color: "#059669", fontSize: 22 }}>
            {totals.earnedINR > 0 ? formatINR(totals.earnedINR) : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {totals.earnedUSD > 0 ? formatUSD(totals.earnedUSD) : ""}
            {totals.rewardCountINR + totals.rewardCountUSD > 0
              ? ` · ${totals.rewardCountINR + totals.rewardCountUSD} reward${
                  totals.rewardCountINR + totals.rewardCountUSD === 1 ? "" : "s"
                }`
              : ""}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Paid out</div>
          <div className="admin-stat-value" style={{ fontSize: 22 }}>
            {totals.paidOutINR > 0 ? formatINR(totals.paidOutINR) : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {totals.paidOutUSD > 0 ? formatUSD(totals.paidOutUSD) : ""}
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Pending</div>
          <div
            className="admin-stat-value"
            style={{ color: totals.pendingINR + totals.pendingUSD > 0 ? "#dc2626" : "#0f172a", fontSize: 22 }}
          >
            {totals.pendingINR > 0 ? formatINR(totals.pendingINR) : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {totals.pendingUSD > 0 ? formatUSD(totals.pendingUSD) : ""}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
            Referred users
          </h2>
          <div className="admin-table-card" style={{ marginBottom: 24 }}>
            {referredUsers.length === 0 ? (
              <div className="admin-empty">
                <p className="admin-empty-title">No referred users yet</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.map((u) => (
                    <tr key={u.email}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name || "—"}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{u.email}</div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-blue">
                          {u.planTier ?? "free"}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
            Reward ledger
          </h2>
          <div className="admin-table-card" style={{ marginBottom: 24 }}>
            {rewards.length === 0 ? (
              <div className="admin-empty">
                <p className="admin-empty-title">No rewards earned yet</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Referred user</th>
                    <th>Order</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((r) => (
                    <tr key={String(r._id)}>
                      <td style={{ fontSize: 12, color: "#64748b" }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: 12 }}>{r.referredEmail}</td>
                      <td>
                        <code
                          style={{
                            fontSize: 11,
                            background: "#f1f5f9",
                            padding: "2px 5px",
                            borderRadius: 4,
                          }}
                        >
                          {r.orderId.slice(0, 14)}…
                        </code>
                      </td>
                      <td>
                        <strong style={{ color: "#059669" }}>
                          {r.currency === "INR"
                            ? formatINR(r.rewardAmount)
                            : formatUSD(r.rewardAmount)}
                        </strong>
                      </td>
                      <td>
                        {r.paidOutAt ? (
                          <span className="admin-badge admin-badge-green">
                            Paid {new Date(r.paidOutAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-gray">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
            Payout history
          </h2>
          <div className="admin-table-card">
            {payouts.length === 0 ? (
              <div className="admin-empty">
                <p className="admin-empty-title">No payouts recorded yet</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={String(p._id)}>
                      <td style={{ fontSize: 12, color: "#64748b" }}>
                        {new Date(p.paidAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-purple">{p.method}</span>
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>
                        {p.reference || "—"}
                      </td>
                      <td>
                        <strong>
                          {p.currency === "INR" ? formatINR(p.amount) : formatUSD(p.amount)}
                        </strong>
                      </td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{p.paidBy}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>
            Record payout
          </h2>
          <PayoutForm
            referrerEmail={email}
            pendingINR={totals.pendingINR}
            pendingUSD={totals.pendingUSD}
            unpaidRewards={unpaidRewards.map((r) => ({
              id: String(r._id),
              referredEmail: r.referredEmail,
              orderId: r.orderId,
              amount: r.rewardAmount,
              currency: r.currency,
              createdAt: r.createdAt,
            }))}
          />
        </div>
      </div>
    </>
  )
}

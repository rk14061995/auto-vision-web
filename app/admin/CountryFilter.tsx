"use client"

import { useRouter } from "next/navigation"

export default function CountryFilter({ current }: { current: string }) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    document.cookie = `admin-country=${e.target.value}; path=/admin; max-age=31536000; SameSite=Lax`
    router.refresh()
  }

  return (
    <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #e2e8f0", marginTop: 4 }}>
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Market filter
      </div>
      <select
        value={current}
        onChange={handleChange}
        className="admin-form-select"
        style={{ width: "100%", fontSize: 12, padding: "4px 6px" }}
      >
        <option value="">All markets</option>
        <option value="IN">India (IN)</option>
        <option value="US">United States (US)</option>
      </select>
    </div>
  )
}

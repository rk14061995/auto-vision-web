import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import "./admin.css"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.email) redirect("/login")

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) redirect("/")

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav-brand">
          <span className="admin-nav-logo">AV</span>
          <span className="admin-nav-title">Admin</span>
        </div>
        <nav className="admin-nav-links">
          <Link href="/admin" className="admin-nav-link">Dashboard</Link>
          <hr className="admin-nav-divider" />
          <span className="admin-nav-section">Catalog</span>
          <Link href="/admin/car-models" className="admin-nav-link">Car Models</Link>
          <Link href="/admin/accessories" className="admin-nav-link">Accessories</Link>
          <hr className="admin-nav-divider" />
          <span className="admin-nav-section">Users</span>
          <Link href="/admin/users" className="admin-nav-link">All Users</Link>
          <Link href="/admin/analytics" className="admin-nav-link">Analytics & interests</Link>
          <Link href="/admin/projects" className="admin-nav-link">Projects</Link>
          <hr className="admin-nav-divider" />
          <span className="admin-nav-section">Marketing</span>
          <Link href="/admin/coupons" className="admin-nav-link">Coupons</Link>
          <Link href="/admin/ads" className="admin-nav-link">Advertisements</Link>
          <hr className="admin-nav-divider" />
          <span className="admin-nav-section">Teams</span>
          <Link href="/admin/teams" className="admin-nav-link">Teams</Link>
          <hr className="admin-nav-divider" />
          <span className="admin-nav-section">Marketplace</span>
          <Link href="/admin/marketplace" className="admin-nav-link">Marketplace Assets</Link>
          <Link href="/admin/templates" className="admin-nav-link">Template Drops</Link>
          <hr className="admin-nav-divider" />
          <span className="admin-nav-section">Finance</span>
          <Link href="/admin/orders" className="admin-nav-link">Orders & Revenue</Link>
          <Link href="/admin/revenue" className="admin-nav-link">Revenue by user</Link>
          <Link href="/admin/referrals" className="admin-nav-link">Referrers & payouts</Link>
          <Link href="/admin/migrate" className="admin-nav-link">Plan Migration</Link>
          <hr className="admin-nav-divider" />
          <Link href="/" className="admin-nav-link admin-nav-back">Back to App</Link>
        </nav>
        <div className="admin-nav-user">{session.user.email}</div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}

"use server"
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
          <Link href="/admin/car-models" className="admin-nav-link">Car Models</Link>
          <Link href="/admin/accessories" className="admin-nav-link">Accessories</Link>
          <hr className="admin-nav-divider" />
          <Link href="/admin/coupons" className="admin-nav-link">Coupons</Link>
          <Link href="/" className="admin-nav-link admin-nav-back">Back to App</Link>
        </nav>
        <div className="admin-nav-user">{session.user.email}</div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}

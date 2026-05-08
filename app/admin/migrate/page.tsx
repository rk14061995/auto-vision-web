import { MigrateClient } from "./migrate-client"

export const metadata = { title: "Plan Migration — Admin" }

export default function AdminMigratePage() {
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Plan Migration</h1>
      <p className="admin-page-subtitle">
        Migrate legacy plan IDs (1-project, 5-projects, 50-projects, 100-projects, business)
        to the new tier system (free, creator, pro, studio, enterprise) with grandfathered
        project limits and a one-time AI credit grant. Idempotent — already-migrated users
        are skipped.
      </p>
      <MigrateClient />
    </div>
  )
}

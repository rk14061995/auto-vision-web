import { listAllTemplates } from "@/lib/templates"
import { TemplatesAdminClient } from "./templates-client"

export const metadata = { title: "Template Drops — Admin" }

export default async function AdminTemplatesPage() {
  const templates = await listAllTemplates()
  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Weekly template drops</h1>
      <p className="admin-page-subtitle">
        Schedule and manage the weekly creative drops that appear at <code>/templates</code>.
      </p>
      <TemplatesAdminClient initialTemplates={JSON.parse(JSON.stringify(templates))} />
    </div>
  )
}

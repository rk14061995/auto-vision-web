"use client"

import { useState } from "react"
import type { TemplateDrop } from "@/lib/db"

interface Props {
  initialTemplates: TemplateDrop[]
}

export function TemplatesAdminClient({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    assetUrl: "",
    tags: "",
    isActive: true,
  })
  const [busy, setBusy] = useState(false)

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          thumbnailUrl: form.thumbnailUrl,
          assetUrl: form.assetUrl,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          isActive: form.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTemplates([json.drop, ...templates])
      setForm({
        title: "",
        description: "",
        thumbnailUrl: "",
        assetUrl: "",
        tags: "",
        isActive: true,
      })
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch("/api/admin/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error)
      return
    }
    setTemplates((cur) => cur.map((t) => (String(t._id) === id ? json.drop : t)))
  }

  async function remove(id: string) {
    if (!confirm("Delete this drop?")) return
    const res = await fetch("/api/admin/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error || "Failed to delete")
      return
    }
    setTemplates((cur) => cur.filter((t) => String(t._id) !== id))
  }

  return (
    <div>
      <form onSubmit={create} className="admin-card" style={{ display: "grid", gap: 12 }}>
        <h3>Add a new drop</h3>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          required
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          rows={2}
          required
        />
        <input
          value={form.thumbnailUrl}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
          placeholder="Thumbnail URL"
          required
        />
        <input
          value={form.assetUrl}
          onChange={(e) => setForm({ ...form, assetUrl: e.target.value })}
          placeholder="Asset URL"
          required
        />
        <input
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="Comma-separated tags"
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Publish immediately
        </label>
        <button className="admin-btn admin-btn-primary" disabled={busy}>
          {busy ? "Saving..." : "Add drop"}
        </button>
      </form>

      <div className="admin-table-wrap" style={{ marginTop: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tags</th>
              <th>Active</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => {
              const id = String(t._id)
              return (
                <tr key={id}>
                  <td>{t.title}</td>
                  <td>{(t.tags || []).join(", ")}</td>
                  <td>{t.isActive ? "Yes" : "No"}</td>
                  <td>{new Date(t.publishedAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="admin-btn"
                        onClick={() => toggleActive(id, !t.isActive)}
                      >
                        {t.isActive ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => remove(id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

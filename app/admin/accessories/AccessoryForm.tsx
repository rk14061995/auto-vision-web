"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const CATEGORIES = ["Spoilers", "Side Skirts", "Front Lips", "Rear Bumpers", "Antennas", "Roof Racks", "Body Kits", "Other"]

export default function AccessoryForm({ mode, id }: { mode: "new" | "edit"; id?: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Spoilers")
  const [accessoryType, setAccessoryType] = useState<"3d" | "2d" | "both">("both")
  const [model3dUrl, setModel3dUrl] = useState("")
  const [image2dUrl, setImage2dUrl] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [pos, setPos] = useState<[string, string, string]>(["0", "1.5", "-1.8"])
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const thumbRef = useRef<HTMLInputElement>(null)
  const model3dRef = useRef<HTMLInputElement>(null)
  const image2dRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mode !== "edit" || !id) return
    fetch(`/api/admin/accessories/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.accessory) { setError("Accessory not found"); return }
        const a = d.accessory
        setName(a.name || "")
        setCategory(a.category || "Spoilers")
        setAccessoryType(a.accessoryType || "both")
        setModel3dUrl(a.model3dUrl || "")
        setImage2dUrl(a.image2dUrl || "")
        setThumbnailUrl(a.thumbnailUrl || "")
        const p = a.defaultPosition3d || [0, 1.5, -1.8]
        setPos([String(p[0]), String(p[1]), String(p[2])])
        setIsActive(a.isActive !== false)
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false))
  }, [mode, id])

  const uploadFile = async (file: File, folder: string) => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (!data.url) throw new Error("Upload failed")
    return data.url as string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError("Name is required"); return }
    setSaving(true)
    setError("")
    try {
      const payload = {
        name, category, accessoryType, model3dUrl, image2dUrl, thumbnailUrl,
        defaultPosition3d: [parseFloat(pos[0]) || 0, parseFloat(pos[1]) || 0, parseFloat(pos[2]) || 0],
        isActive,
      }
      const url = mode === "new" ? "/api/admin/accessories" : `/api/admin/accessories/${id}`
      const res = await fetch(url, {
        method: mode === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Save failed"); return }
      setSuccess(mode === "new" ? "Accessory created!" : "Changes saved!")
      if (mode === "new") router.push("/admin/accessories")
    } catch { setError("Network error") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!id || !confirm("Delete this accessory?")) return
    await fetch(`/api/admin/accessories/${id}`, { method: "DELETE" })
    router.push("/admin/accessories")
  }

  if (loading) return <div className="admin-spinner" />

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{mode === "new" ? "Add Accessory" : "Edit Accessory"}</h1>
          <p className="admin-page-sub">Upload 3D model (GLTF/GLB) and/or 2D PNG for this accessory</p>
        </div>
        <Link href="/admin/accessories" className="admin-btn admin-btn-secondary">Back to List</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card">
        {error && <div className="admin-form-error">{error}</div>}
        {success && <div className="admin-form-success">{success}</div>}

        {/* Basic Info */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Basic Info</div>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-form-label">Name *</label>
              <input className="admin-form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="GT Wing Spoiler" required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Category</label>
              <select className="admin-form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Type</label>
              <select className="admin-form-select" value={accessoryType} onChange={(e) => setAccessoryType(e.target.value as "3d" | "2d" | "both")}>
                <option value="both">Both (3D + 2D)</option>
                <option value="3d">3D only</option>
                <option value="2d">2D only</option>
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-toggle" style={{ paddingTop: 22 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Thumbnail</div>
          <div className="admin-upload-row">
            {thumbnailUrl && <img src={thumbnailUrl} alt="" className="admin-thumb-preview" />}
            <div style={{ flex: 1 }}>
              <input className="admin-form-input" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." />
              <input ref={thumbRef} type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => { if (e.target.files?.[0]) { try { setThumbnailUrl(await uploadFile(e.target.files[0], "auto-vision/catalog/thumbnails")) } catch { setError("Upload failed") } } e.target.value = "" }} />
              <button type="button" className="admin-upload-btn" style={{ marginTop: 6 }} onClick={() => thumbRef.current?.click()}>Upload Thumbnail</button>
            </div>
          </div>
        </div>

        {/* 3D Model */}
        {(accessoryType === "3d" || accessoryType === "both") && (
          <div className="admin-form-section">
            <div className="admin-form-section-title">3D Model (GLTF / GLB)</div>
            <div className="admin-upload-row">
              <div style={{ flex: 1 }}>
                <input className="admin-form-input" value={model3dUrl} onChange={(e) => setModel3dUrl(e.target.value)} placeholder="https://..." />
                {model3dUrl && <span style={{ fontSize: 11, color: "#059669", display: "block", marginTop: 4 }}>3D model URL set</span>}
                <input ref={model3dRef} type="file" accept=".glb,.gltf" style={{ display: "none" }} onChange={async (e) => { if (e.target.files?.[0]) { try { setModel3dUrl(await uploadFile(e.target.files[0], "auto-vision/catalog/models3d")) } catch { setError("Upload failed") } } e.target.value = "" }} />
                <button type="button" className="admin-upload-btn" style={{ marginTop: 6 }} onClick={() => model3dRef.current?.click()}>Upload GLB / GLTF</button>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <label className="admin-form-label" style={{ marginBottom: 6, display: "block" }}>Default 3D Position (X, Y, Z)</label>
              <div className="admin-form-grid-3">
                {["X", "Y", "Z"].map((axis, i) => (
                  <div key={axis} className="admin-form-field">
                    <label className="admin-form-label">{axis}</label>
                    <input className="admin-form-input" type="number" step="0.01" value={pos[i]} onChange={(e) => setPos((p) => { const n = [...p] as [string, string, string]; n[i] = e.target.value; return n })} />
                  </div>
                ))}
              </div>
              <span className="admin-form-hint">Position relative to car center. Y=up, Z=front/back, X=left/right</span>
            </div>
          </div>
        )}

        {/* 2D Image */}
        {(accessoryType === "2d" || accessoryType === "both") && (
          <div className="admin-form-section">
            <div className="admin-form-section-title">2D Overlay Image (PNG)</div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px" }}>PNG shown in the 2D editor sidebar. User can place it on their car photo.</p>
            <div className="admin-upload-row">
              {image2dUrl && <img src={image2dUrl} alt="" className="admin-thumb-preview" style={{ width: 80, height: 60 }} />}
              <div style={{ flex: 1 }}>
                <input className="admin-form-input" value={image2dUrl} onChange={(e) => setImage2dUrl(e.target.value)} placeholder="https://..." />
                <input ref={image2dRef} type="file" accept="image/png,image/webp" style={{ display: "none" }} onChange={async (e) => { if (e.target.files?.[0]) { try { setImage2dUrl(await uploadFile(e.target.files[0], "auto-vision/catalog/2d-accessories")) } catch { setError("Upload failed") } } e.target.value = "" }} />
                <button type="button" className="admin-upload-btn" style={{ marginTop: 6 }} onClick={() => image2dRef.current?.click()}>Upload PNG</button>
              </div>
            </div>
          </div>
        )}

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? "Saving..." : mode === "new" ? "Create Accessory" : "Save Changes"}
          </button>
          <Link href="/admin/accessories" className="admin-btn admin-btn-secondary">Cancel</Link>
          {mode === "edit" && (
            <button type="button" className="admin-btn admin-btn-danger" style={{ marginLeft: "auto" }} onClick={handleDelete}>Delete</button>
          )}
        </div>
      </form>
    </>
  )
}

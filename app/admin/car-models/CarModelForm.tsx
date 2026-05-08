"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Image2D {
  id: string
  label: string
  url: string
  angle: string
}

interface Accessory {
  _id: string
  name: string
  category: string
  accessoryType: string
}

const ANGLES = ["front", "side-left", "side-right", "rear", "top", "3q-front", "3q-rear"]

export default function CarModelForm({ mode, id }: { mode: "new" | "edit"; id?: string }) {
  const router = useRouter()
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [model3dUrl, setModel3dUrl] = useState("")
  const [images2d, setImages2d] = useState<Image2D[]>([])
  const [selectedAccIds, setSelectedAccIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([])
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const model3dInputRef = useRef<HTMLInputElement>(null)

  const slug = `${make}-${model}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  useEffect(() => {
    fetch("/api/admin/accessories")
      .then((r) => r.json())
      .then((d) => { if (d.accessories) setAllAccessories(d.accessories) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mode !== "edit" || !id) return
    fetch(`/api/admin/car-catalog/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.car) { setError("Car not found"); return }
        const c = d.car
        setMake(c.make || "")
        setModel(c.model || "")
        setYear(c.year || "")
        setThumbnailUrl(c.thumbnailUrl || "")
        setModel3dUrl(c.model3dUrl || "")
        setImages2d(c.images2d || [])
        setSelectedAccIds(c.accessoryIds || [])
        setIsActive(c.isActive !== false)
      })
      .catch(() => setError("Failed to load car"))
      .finally(() => setLoading(false))
  }, [mode, id])

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (!data.url) throw new Error("Upload failed")
    return data.url
  }

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file, "auto-vision/catalog/thumbnails")
      setThumbnailUrl(url)
    } catch { setError("Thumbnail upload failed") }
    e.target.value = ""
  }

  const handle3dUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file, "auto-vision/catalog/models3d")
      setModel3dUrl(url)
    } catch { setError("3D model upload failed") }
    e.target.value = ""
  }

  const addImage = () => {
    setImages2d((prev) => [
      ...prev,
      { id: Date.now().toString(), label: "", url: "", angle: "front" },
    ])
  }

  const updateImage = (id: string, field: keyof Image2D, value: string) => {
    setImages2d((prev) => prev.map((img) => (img.id === id ? { ...img, [field]: value } : img)))
  }

  const uploadImage2d = async (id: string, file: File) => {
    try {
      const url = await uploadFile(file, "auto-vision/catalog/images2d")
      updateImage(id, "url", url)
    } catch { setError("Image upload failed") }
  }

  const removeImage = (id: string) => setImages2d((prev) => prev.filter((i) => i.id !== id))

  const toggleAcc = (accId: string) => {
    setSelectedAccIds((prev) =>
      prev.includes(accId) ? prev.filter((x) => x !== accId) : [...prev, accId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!make.trim() || !model.trim()) { setError("Make and Model are required"); return }

    setSaving(true)
    setError("")
    try {
      const payload = {
        make, model, year, thumbnailUrl, model3dUrl,
        images2d, accessoryIds: selectedAccIds, isActive,
      }
      const url = mode === "new" ? "/api/admin/car-catalog" : `/api/admin/car-catalog/${id}`
      const method = mode === "new" ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Save failed"); return }
      setSuccess(mode === "new" ? "Car model created!" : "Changes saved!")
      if (mode === "new") router.push("/admin/car-models")
    } catch { setError("Network error") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!id || !confirm("Delete this car model? This cannot be undone.")) return
    await fetch(`/api/admin/car-catalog/${id}`, { method: "DELETE" })
    router.push("/admin/car-models")
  }

  if (loading) return <div className="admin-spinner" />

  const accByCategory = allAccessories.reduce<Record<string, Accessory[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{mode === "new" ? "Add Car Model" : "Edit Car Model"}</h1>
          <p className="admin-page-sub">Map 3D model, 2D images and accessories to this car</p>
        </div>
        <Link href="/admin/car-models" className="admin-btn admin-btn-secondary">Back to List</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card">
        {error && <div className="admin-form-error">{error}</div>}
        {success && <div className="admin-form-success">{success}</div>}

        {/* Basic Info */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Basic Info</div>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-form-label">Make *</label>
              <input className="admin-form-input" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Model *</label>
              <input className="admin-form-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Supra" required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Year</label>
              <input className="admin-form-input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2022 or 2019-2023" />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Slug (auto)</label>
              <input className="admin-form-input" value={slug} readOnly style={{ background: "#f8fafc", color: "#64748b" }} />
              <span className="admin-form-hint">Used by the editor to find this car</span>
            </div>
          </div>
          <div className="admin-form-field" style={{ marginTop: 14 }}>
            <label className="admin-form-toggle">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active (visible in editor)
            </label>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Thumbnail</div>
          <div className="admin-form-field">
            <div className="admin-upload-row">
              {thumbnailUrl && <img src={thumbnailUrl} alt="" className="admin-thumb-preview" />}
              <div style={{ flex: 1 }}>
                <input className="admin-form-input" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://... (paste URL or upload)" />
                <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumbUpload} />
                <button type="button" className="admin-upload-btn" style={{ marginTop: 6 }} onClick={() => thumbInputRef.current?.click()}>Upload Image</button>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Model */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">3D Model (GLTF / GLB)</div>
          <div className="admin-form-field">
            <div className="admin-upload-row">
              <div style={{ flex: 1 }}>
                <input className="admin-form-input" value={model3dUrl} onChange={(e) => setModel3dUrl(e.target.value)} placeholder="https://... (paste URL or upload GLB file)" />
                {model3dUrl && <span style={{ fontSize: 11, color: "#059669", display: "block", marginTop: 4 }}>3D model URL set</span>}
                <input ref={model3dInputRef} type="file" accept=".glb,.gltf" style={{ display: "none" }} onChange={handle3dUpload} />
                <button type="button" className="admin-upload-btn" style={{ marginTop: 6 }} onClick={() => model3dInputRef.current?.click()}>Upload GLB / GLTF</button>
              </div>
            </div>
          </div>
        </div>

        {/* 2D Images */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">2D Car Images ({images2d.length})</div>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>
            PNG photos of the car shown in the 2D editor sidebar for the user to place on canvas.
          </p>
          {images2d.map((img) => (
            <div key={img.id} className="admin-list-item">
              {img.url && <img src={img.url} alt="" className="admin-thumb-preview" />}
              <div className="admin-list-item-fields">
                <div className="admin-form-field">
                  <label className="admin-form-label">Label</label>
                  <input className="admin-form-input" value={img.label} onChange={(e) => updateImage(img.id, "label", e.target.value)} placeholder="Front View" />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Angle</label>
                  <select className="admin-form-select" value={img.angle} onChange={(e) => updateImage(img.id, "angle", e.target.value)}>
                    {ANGLES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Image URL / Upload</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input className="admin-form-input" value={img.url} onChange={(e) => updateImage(img.id, "url", e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                    <label className="admin-upload-btn" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
                      Upload
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) uploadImage2d(img.id, e.target.files[0]); e.target.value = "" }} />
                    </label>
                  </div>
                </div>
              </div>
              <button type="button" className="admin-list-item-remove" onClick={() => removeImage(img.id)}>×</button>
            </div>
          ))}
          <button type="button" className="admin-list-add-btn" onClick={addImage}>+ Add 2D Image</button>
        </div>

        {/* Accessories */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Linked Accessories ({selectedAccIds.length} selected)</div>
          <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>
            Select accessories available for this car in the 3D editor. Add accessories first in the Accessories section.
          </p>
          {allAccessories.length === 0 ? (
            <p style={{ fontSize: 13, color: "#94a3b8" }}>No accessories yet. <Link href="/admin/accessories/new" style={{ color: "#3b82f6" }}>Add accessories first.</Link></p>
          ) : (
            <div className="admin-acc-check-grid">
              {Object.entries(accByCategory).map(([cat, accs]) => (
                <div key={cat} style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 4px" }}>{cat}</div>
                  {accs.map((acc) => (
                    <label key={acc._id} className="admin-acc-check-item">
                      <input type="checkbox" checked={selectedAccIds.includes(acc._id)} onChange={() => toggleAcc(acc._id)} />
                      {acc.name}
                      <span className={`admin-badge admin-acc-cat ${acc.accessoryType === "3d" ? "admin-badge-blue" : acc.accessoryType === "2d" ? "admin-badge-purple" : "admin-badge-green"}`}>{acc.accessoryType}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? "Saving..." : mode === "new" ? "Create Car Model" : "Save Changes"}
          </button>
          <Link href="/admin/car-models" className="admin-btn admin-btn-secondary">Cancel</Link>
          {mode === "edit" && (
            <button type="button" className="admin-btn admin-btn-danger" style={{ marginLeft: "auto" }} onClick={handleDelete}>Delete</button>
          )}
        </div>
      </form>
    </>
  )
}

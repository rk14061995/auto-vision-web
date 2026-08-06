"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AD_TYPES, formatPrice } from "@/lib/products"

const CATEGORIES = [
  { value: "customization", label: "Customization Shop" },
  { value: "mechanic", label: "Mechanic / Garage" },
  { value: "tyre", label: "Tyre & Wheel Alignment" },
  { value: "detailing", label: "Detailing" },
  { value: "other", label: "Other" },
]

const PAYMENT_METHODS = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "razorpay", label: "Razorpay Payment Link" },
  { value: "other", label: "Other" },
]

export default function NewAdForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [shopName, setShopName] = useState("")
  const [category, setCategory] = useState("tyre")
  const [city, setCity] = useState("")
  const [shopDescription, setShopDescription] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [shopEmail, setShopEmail] = useState("")
  const [adType, setAdType] = useState(AD_TYPES[0].id)
  const [images, setImages] = useState<string[]>([])
  const [paymentAmount, setPaymentAmount] = useState(String(AD_TYPES[0].pricing.IN.amount))
  const [paymentMethod, setPaymentMethod] = useState("upi")
  const [notes, setNotes] = useState("")

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedAdType = AD_TYPES.find((t) => t.id === adType) ?? AD_TYPES[0]

  async function handleUpload(file: File) {
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "auto-vision/advertisements")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!data.url) throw new Error("Upload failed")
      setImages((prev) => [...prev, data.url as string])
    } catch {
      setError("Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url))
  }

  function onAdTypeChange(id: string) {
    setAdType(id)
    const t = AD_TYPES.find((t) => t.id === id)
    if (t) setPaymentAmount(String(t.pricing.IN.amount))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!shopName.trim()) { setError("Shop name is required"); return }
    if (!contactInfo.trim()) { setError("Contact phone/WhatsApp is required"); return }
    if (images.length === 0) { setError("Upload at least one banner image"); return }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName,
          shopDescription,
          contactInfo,
          shopEmail,
          adType,
          images,
          city,
          category,
          paymentAmount: Number(paymentAmount) || 0,
          paymentCurrency: "INR",
          paymentMethod,
          notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to create ad"); return }
      setSuccess("Ad created and live!")
      router.push("/admin/ads")
    } catch {
      setError("Network error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Onboard a Shop</h1>
          <p className="admin-page-sub">Manually add a paying advertiser (tyre shop, mechanic, customization shop, etc.) — goes live immediately</p>
        </div>
        <Link href="/admin/ads" className="admin-btn admin-btn-secondary">Back to List</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form-card">
        {error && <div className="admin-form-error">{error}</div>}
        {success && <div className="admin-form-success">{success}</div>}

        <div className="admin-form-section">
          <div className="admin-form-section-title">Shop Details</div>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-form-label">Shop Name *</label>
              <input className="admin-form-input" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="JK Tyres — Kothrud" required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Category</label>
              <select className="admin-form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">City</label>
              <input className="admin-form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Pune (leave blank for All India)" />
              <span className="admin-form-hint">Ad is shown first to visitors detected in this city, falling back to national slots</span>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Contact Phone / WhatsApp *</label>
              <input className="admin-form-input" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="+91 98765 43210" required />
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Shop Email</label>
              <input className="admin-form-input" type="email" value={shopEmail} onChange={(e) => setShopEmail(e.target.value)} placeholder="optional — links ad to their account if they sign up" />
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Description</label>
              <textarea className="admin-form-textarea" value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} placeholder="Wheel alignment, balancing & tyre replacement — same-day service" />
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">Banner Image</div>
          <div className="admin-upload-row" style={{ flexWrap: "wrap", gap: 10 }}>
            {images.map((url) => (
              <div key={url} style={{ position: "relative" }}>
                <img src={url} alt="" className="admin-thumb-preview" style={{ width: 120, height: 60, objectFit: "cover" }} />
                <button type="button" onClick={() => removeImage(url)} className="admin-btn admin-btn-danger admin-btn-sm" style={{ position: "absolute", top: 2, right: 2, padding: "1px 6px" }}>×</button>
              </div>
            ))}
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = "" }} />
              <button type="button" className="admin-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
              <span className="admin-form-hint" style={{ display: "block", marginTop: 4 }}>{selectedAdType.dimensions}</span>
            </div>
          </div>
        </div>

        <div className="admin-form-section">
          <div className="admin-form-section-title">Placement & Payment</div>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label className="admin-form-label">Ad Placement</label>
              <select className="admin-form-select" value={adType} onChange={(e) => onAdTypeChange(e.target.value)}>
                {AD_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} — {formatPrice(t.pricing.IN.amount, "INR")}/{t.duration}d</option>
                ))}
              </select>
              <span className="admin-form-hint">{selectedAdType.description}</span>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Amount Collected (₹)</label>
              <input className="admin-form-input" type="number" min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
              <span className="admin-form-hint">Editable — use for discounted local-shop pricing</span>
            </div>
            <div className="admin-form-field">
              <label className="admin-form-label">Payment Method</label>
              <select className="admin-form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="admin-form-field full">
              <label className="admin-form-label">Internal Notes</label>
              <textarea className="admin-form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sales contact, renewal reminder date, deal terms..." />
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving || uploading}>
            {saving ? "Creating..." : "Create & Go Live"}
          </button>
          <Link href="/admin/ads" className="admin-btn admin-btn-secondary">Cancel</Link>
        </div>
      </form>
    </>
  )
}

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Upload, X } from "lucide-react"
import { getAdTypeById } from "@/lib/products"
import { toast } from "sonner"

export interface EditableAd {
  _id: string
  shopName: string
  shopDescription: string
  contactInfo: string
  images: string[]
  adType: string
}

interface EditAdDialogProps {
  ad: EditableAd
  open: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSaved: (updated: any) => void
}

export function EditAdDialog({ ad, open, onClose, onSaved }: EditAdDialogProps) {
  const [shopName, setShopName] = useState(ad.shopName)
  const [shopDescription, setShopDescription] = useState(ad.shopDescription)
  const [contactInfo, setContactInfo] = useState(ad.contactInfo)
  // existing URLs the user hasn't removed
  const [keptImages, setKeptImages] = useState<string[]>(ad.images)
  // new files to upload
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const adConfig = getAdTypeById(ad.adType)
  const maxImages = adConfig?.maxImages ?? 1
  const totalImages = keptImages.length + newFiles.length

  function removeKept(url: string) {
    setKeptImages((prev) => prev.filter((u) => u !== url))
  }

  function removeNew(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const available = maxImages - totalImages
    if (available <= 0) return
    setNewFiles((prev) => [...prev, ...files.slice(0, available)])
    // reset so same file can be re-selected if removed
    e.target.value = ""
  }

  async function handleSave() {
    if (totalImages === 0) {
      toast.error("At least one image is required")
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("shopName", shopName)
      formData.append("shopDescription", shopDescription)
      formData.append("contactInfo", contactInfo)
      keptImages.forEach((url) => formData.append("keptImages", url))
      newFiles.forEach((file) => formData.append("newImages", file))

      const res = await fetch(`/api/ads/${ad._id}`, { method: "PATCH", body: formData })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? "Update failed")
      }
      const updated = await res.json()
      toast.success("Ad updated successfully")
      onSaved(updated)
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Advertisement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-shopName">Shop Name</Label>
            <Input
              id="edit-shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Shop Description</Label>
            <Textarea
              id="edit-desc"
              rows={3}
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-contact">Contact Information</Label>
            <Input
              id="edit-contact"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>

          {/* Image management */}
          <div className="space-y-2">
            <Label>Images ({totalImages}/{maxImages})</Label>

            <div className="flex flex-wrap gap-2">
              {/* Existing kept images */}
              {keptImages.map((url) => (
                <div key={url} className="relative group w-20 h-20">
                  <img
                    src={url}
                    alt="Ad image"
                    className="w-full h-full object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeKept(url)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* New file previews */}
              {newFiles.map((file, i) => (
                <div key={i} className="relative group w-20 h-20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="New upload"
                    className="w-full h-full object-cover rounded-lg border border-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeNew(i)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-primary/80 text-primary-foreground rounded-b-lg py-0.5">
                    New
                  </span>
                </div>
              ))}

              {/* Upload button */}
              {totalImages < maxImages && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px]">Add</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              PNG or JPG, up to 10 MB each. Hover an image and click ✕ to remove it.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || totalImages === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

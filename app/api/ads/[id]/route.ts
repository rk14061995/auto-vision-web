import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAdvertisementsByEmail, updateAdvertisement } from "@/lib/db"
import { getAdTypeById } from "@/lib/products"
import { uploadImage } from "@/lib/cloudinary"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const userAds = await getAdvertisementsByEmail(session.user.email)
  const ad = userAds.find((a) => a._id?.toString() === id)
  if (!ad) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const shopName = (formData.get("shopName") as string | null) ?? ad.shopName
  const shopDescription = (formData.get("shopDescription") as string | null) ?? ad.shopDescription
  const contactInfo = (formData.get("contactInfo") as string | null) ?? ad.contactInfo

  // keptImages: existing Cloudinary URLs the user chose to keep
  const keptImages = formData.getAll("keptImages") as string[]

  // newImages: new files to upload
  const newImageFiles = formData.getAll("newImages") as File[]
  const adConfig = getAdTypeById(ad.adType)
  const maxImages = adConfig?.maxImages ?? 1

  const uploadedUrls: string[] = []
  for (const file of newImageFiles) {
    if (!file || file.size === 0) continue
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, { folder: "auto-vision/advertisements" })
    uploadedUrls.push(result.secure_url)
  }

  const finalImages = [...keptImages, ...uploadedUrls].slice(0, maxImages)
  if (finalImages.length === 0) {
    return NextResponse.json({ error: "At least one image is required" }, { status: 400 })
  }

  const updated = await updateAdvertisement(id, {
    shopName,
    shopDescription,
    contactInfo,
    images: finalImages,
  })

  return NextResponse.json(updated)
}

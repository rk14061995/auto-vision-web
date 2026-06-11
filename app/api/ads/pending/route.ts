import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdvertisement } from "@/lib/db"
import { getAdTypeById } from "@/lib/products"
import { uploadImage } from "@/lib/cloudinary"
import { uploadVideoToS3 } from "@/lib/s3"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const shopName = formData.get("shopName") as string
  const shopDescription = formData.get("shopDescription") as string
  const contactInfo = formData.get("contactInfo") as string
  const adType = formData.get("adType") as string
  const imageFiles = formData.getAll("images") as File[]

  if (!shopName || !shopDescription || !contactInfo || !adType || imageFiles.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const adConfig = getAdTypeById(adType)
  if (!adConfig) {
    return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
  }

  const uploadedImages: string[] = []
  for (const file of imageFiles) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadImage(buffer, { folder: "auto-vision/advertisements" })
    uploadedImages.push(result.secure_url)
  }

  // Optional video for vertical ads — uploaded to S3
  const videoFile = formData.get("video") as File | null
  if (videoFile && videoFile.size > 0) {
    if (videoFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Video must be under 10MB" }, { status: 400 })
    }
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    const videoUrl = await uploadVideoToS3(buffer, videoFile.name, videoFile.type)
    uploadedImages.push(videoUrl)
  }

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + adConfig.duration)

  const ad = await createAdvertisement({
    email: session.user.email,
    shopName,
    shopDescription,
    contactInfo,
    images: uploadedImages,
    adType: adType as Advertisement["adType"],
    startDate,
    endDate,
    paymentAmount: adConfig.pricing.US.amount,
    paymentCurrency: "USD",
    paymentId: null,
  })

  return NextResponse.json({ pendingAdId: ad._id?.toString() })
}

// Import needed for the type cast
import type { Advertisement } from "@/lib/db"

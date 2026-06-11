import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDesignRequest, getDesignRequestsByEmail } from "@/lib/db"
import { getDesignServicePrice } from "@/lib/products"
import { uploadImage } from "@/lib/cloudinary"

// GET — list the current user's design requests
export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const requests = await getDesignRequestsByEmail(session.user.email)
  return NextResponse.json(requests)
}

// POST — save a new design request (pending_payment)
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const adType = formData.get("adType") as string
  const shopName = formData.get("shopName") as string
  const tagline = formData.get("tagline") as string
  const shopDescription = formData.get("shopDescription") as string
  const referenceNotes = (formData.get("referenceNotes") as string) || undefined
  const brandColorsRaw = formData.get("brandColors") as string
  const brandColors: string[] = brandColorsRaw ? JSON.parse(brandColorsRaw) : []
  const selectedCopyRaw = formData.get("selectedCopy") as string | null
  const selectedCopy = selectedCopyRaw ? JSON.parse(selectedCopyRaw) : undefined

  if (!adType || !shopName || !shopDescription) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const country: "IN" | "US" = session.user.country === "US" ? "US" : "IN"
  const pricing = getDesignServicePrice(adType, country)
  if (!pricing) {
    return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
  }

  // Optional logo upload
  let logoUrl: string | undefined
  const logoFile = formData.get("logo") as File | null
  if (logoFile && logoFile.size > 0) {
    const buffer = Buffer.from(await logoFile.arrayBuffer())
    const result = await uploadImage(buffer, { folder: "auto-vision/design-requests/logos" })
    logoUrl = result.secure_url
  }

  const designRequest = await createDesignRequest({
    email: session.user.email,
    adType: adType as "banner" | "vertical_basic" | "vertical_premium" | "landing_hero",
    shopName,
    tagline,
    shopDescription,
    brandColors,
    logoUrl,
    referenceNotes,
    selectedCopy,
    paymentAmount: pricing.amount,
    paymentCurrency: pricing.currency,
    paymentId: null,
    status: "pending_payment",
  })

  return NextResponse.json({ requestId: designRequest._id?.toString() }, { status: 201 })
}

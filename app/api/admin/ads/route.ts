import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAllAdvertisements, createAdvertisement, type Advertisement } from "@/lib/db"
import { getAdTypeById } from "@/lib/products"

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return null
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim())
  if (!adminEmails.includes(session.user.email)) return null
  return session
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const ads = await getAllAdvertisements()
  return NextResponse.json(ads)
}

// POST — admin manually onboards a shop (mechanic/tyre/customization shop, etc.)
// that was signed up offline. Goes live immediately since payment was already
// collected outside the self-serve checkout flow (cash/UPI/bank transfer/payment link).
export async function POST(request: Request) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const {
    shopName,
    shopDescription,
    contactInfo,
    shopEmail,
    adType,
    images,
    city,
    category,
    paymentAmount,
    paymentCurrency,
    paymentMethod,
    notes,
    durationDays,
  } = body

  if (!shopName || !contactInfo || !adType || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const adConfig = getAdTypeById(adType)
  if (!adConfig) return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + (Number(durationDays) > 0 ? Number(durationDays) : adConfig.duration))

  const currency: Advertisement["paymentCurrency"] = paymentCurrency === "USD" ? "USD" : "INR"

  const ad = await createAdvertisement(
    {
      email: shopEmail?.trim() || session.user!.email!,
      shopName,
      shopDescription: shopDescription || "",
      contactInfo,
      images,
      adType: adType as Advertisement["adType"],
      startDate,
      endDate,
      paymentAmount: Number(paymentAmount) || adConfig.pricing[currency === "USD" ? "US" : "IN"].amount,
      paymentCurrency: currency,
      paymentId: `manual:${paymentMethod || "offline"}:${session.user!.email}`,
      city: city?.trim() || undefined,
      category: category || undefined,
      source: "manual",
      paymentMethod: paymentMethod || "other",
      notes: notes || undefined,
    },
    "active"
  )

  return NextResponse.json(ad)
}

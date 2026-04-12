import { getActiveAdvertisements } from '@/lib/db';

// GET /api/ads/random - returns random active ads for marketing
export async function GET_RANDOM(request: NextRequest) {
  try {
    // Fetch all active ads
    const allAds = await getActiveAdvertisements();
    // Shuffle and pick up to 5 random ads
    const shuffled = allAds.sort(() => 0.5 - Math.random());
    const randomAds = shuffled.slice(0, 5);
    return NextResponse.json(randomAds);
  } catch (error) {
    console.error('Error fetching random ads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createAdvertisement, getAdvertisementsByEmail } from "@/lib/db"
import { getAdTypeById } from "@/lib/products"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const advertisements = await getAdvertisementsByEmail(session.user.email)

    return NextResponse.json(advertisements)
  } catch (error) {
    console.error("Error fetching advertisements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { shopName, shopDescription, contactInfo, adType, images, paymentId } = body

    if (!shopName || !shopDescription || !contactInfo || !adType || !images || images.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adTypeConfig = getAdTypeById(adType)
    if (!adTypeConfig) {
      return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
    }

    // Determine currency based on user's country
    const currency = session.user.country === "US" ? "USD" : "INR"
    const amount = adTypeConfig.pricing[currency === "USD" ? "US" : "IN"].amount

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + adTypeConfig.duration)

    const advertisement = await createAdvertisement({
      email: session.user.email,
      shopName,
      shopDescription,
      contactInfo,
      images, // This would be URLs after uploading to cloud storage
      adType,
      startDate,
      endDate,
      paymentAmount: amount,
      paymentCurrency: currency,
      paymentId: paymentId || null,
    })

    return NextResponse.json(advertisement, { status: 201 })
  } catch (error) {
    console.error("Error creating advertisement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
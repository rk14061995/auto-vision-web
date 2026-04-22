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
import { uploadImage } from "@/lib/cloudinary"

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

    // Parse form data using Next.js native formData()
    const formData = await request.formData()
    
    const shopName = formData.get('shopName') as string
    const shopDescription = formData.get('shopDescription') as string
    const contactInfo = formData.get('contactInfo') as string
    const adType = formData.get('adType') as "banner" | "horizontal" | "square" | "video"
    const paymentId = formData.get('paymentId') as string
    
    // Get all image files with the same name
    const imageFiles = formData.getAll('images') as File[]

    if (!shopName || !shopDescription || !contactInfo || !adType || !imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adTypeConfig = getAdTypeById(adType)
    if (!adTypeConfig) {
      return NextResponse.json({ error: "Invalid ad type" }, { status: 400 })
    }

    // Upload images to Cloudinary
    const uploadedImages: string[] = []
    for (const imageFile of imageFiles) {
      if (imageFile) {
        try {
          const fileBuffer = Buffer.from(await imageFile.arrayBuffer())
          const uploadResult = await uploadImage(fileBuffer, {
            folder: 'auto-vision/advertisements',
          })
          uploadedImages.push(uploadResult.secure_url)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          return NextResponse.json(
            { error: "Failed to upload advertisement images" },
            { status: 500 }
          )
        }
      }
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
      images: uploadedImages,
      adType,
      startDate,
      endDate,
      paymentAmount: amount,
      paymentCurrency: currency,
      paymentId: null, // Will be set after payment verification
    })

    return NextResponse.json(advertisement, { status: 201 })
  } catch (error) {
    console.error("Error creating advertisement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
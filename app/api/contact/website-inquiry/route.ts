import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, businessName, businessType, phone, currentWebsite, requirements, budget } = body

    if (!name || !email || !businessName || !requirements) {
      return NextResponse.json({ error: "Name, email, business name, and requirements are required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const db = await getDb()
    await db.collection("website_inquiries").insertOne({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      businessName: businessName.trim(),
      businessType: businessType?.trim() ?? "",
      phone: phone?.trim() ?? "",
      currentWebsite: currentWebsite?.trim() ?? "",
      requirements: requirements.trim(),
      budget: budget ?? "standard",
      status: "new",
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to submit inquiry" }, { status: 500 })
  }
}

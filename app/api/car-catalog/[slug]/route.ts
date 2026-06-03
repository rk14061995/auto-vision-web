import { NextRequest, NextResponse } from "next/server"
import { getCarCatalogBySlug, getAccessoriesByIds } from "@/lib/db"

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization")
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const car = await getCarCatalogBySlug(slug)
    if (!car) {
      return cors(NextResponse.json({ success: false, error: "Not found" }, { status: 404 }))
    }
    const accessories = await getAccessoriesByIds(car.accessoryIds || [])
    return cors(NextResponse.json({ success: true, carCatalog: { ...car, accessories } }))
  } catch {
    return cors(NextResponse.json({ error: "Failed to fetch car catalog" }, { status: 500 }))
  }
}

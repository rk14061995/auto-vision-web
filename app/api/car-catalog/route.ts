import { NextRequest, NextResponse } from "next/server"
import { getCarCatalogList } from "@/lib/db"

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*")
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization")
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

export async function GET(_req: NextRequest) {
  try {
    const cars = await getCarCatalogList(true)
    return cors(NextResponse.json({ success: true, cars }))
  } catch {
    return cors(NextResponse.json({ error: "Failed to fetch car catalog" }, { status: 500 }))
  }
}

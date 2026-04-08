import { NextResponse } from "next/server"
import { detectCountry } from "@/lib/geo"

export async function GET(request: Request) {
  const country = await detectCountry(new Headers(request.headers))
  
  return NextResponse.json({ country })
}

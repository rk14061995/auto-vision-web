import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveAdvertisements, getUserByEmail } from '@/lib/db';

// /api/ads/random - returns random active ads; empty when the caller is ad-free
export async function GET(request: NextRequest) {
  try {
    // Check if the requesting user has paid for ad-free experience
    const emailFromBearer = request.headers.get("authorization")?.replace("Bearer ", "").trim()
    const session = emailFromBearer ? null : await auth()
    const callerEmail = emailFromBearer || session?.user?.email || null
    if (callerEmail) {
      const user = await getUserByEmail(callerEmail)
      if (user?.adFree) {
        const res = NextResponse.json([]);
        res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
        res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        res.headers.set('Access-Control-Allow-Credentials', 'true');
        return res;
      }
    }

    // Fetch all active ads, optionally filtered by ?type=banner,vertical_basic,...
    const typeParam = request.nextUrl.searchParams.get("type")
    const allowedTypes = typeParam ? typeParam.split(",").map((t) => t.trim()) : null
    let allAds = await getActiveAdvertisements();
    if (allowedTypes) {
      allAds = allAds.filter((a) => allowedTypes.includes(a.adType))
    }
    // Shuffle and pick up to 5 random ads
    const shuffled = allAds.sort(() => 0.5 - Math.random());
    const randomAds = shuffled.slice(0, 5);
    const res = NextResponse.json(randomAds);
    res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    return res;
  } catch (error) {
    console.error('Error fetching random ads:', error);
    const res = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    return res;
  }
}

export async function OPTIONS(request: NextRequest) {
  const res = new Response(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { getActiveAdvertisements } from '@/lib/db';

// /api/ads/random - returns random active ads for marketing
export async function GET(request: NextRequest) {
  try {
    // Fetch all active ads
    const allAds = await getActiveAdvertisements();
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

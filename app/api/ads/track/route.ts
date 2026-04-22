import { NextRequest, NextResponse } from "next/server";
import { updateAdTracking } from '@/lib/db';

// POST /api/ads/track - update click or view count for an ad
export async function POST(request: NextRequest) {
  try {
    const { adId, action } = await request.json();

    if (!adId || !action || !['click', 'view'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // Update the tracking in database
    const result = await updateAdTracking(adId, action);

    if (!result) {
      return NextResponse.json({ error: 'Ad not found or update failed' }, { status: 404 });
    }

    const res = NextResponse.json({ 
      success: true, 
      message: `${action} count updated successfully`,
      data: result
    });

    // Set CORS headers
    res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');

    return res;
  } catch (error) {
    console.error('Error updating ad tracking:', error);
    const res = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    return res;
  }
}

export async function OPTIONS(request: NextRequest) {
  const res = new Response(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}

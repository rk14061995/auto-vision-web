import { NextRequest, NextResponse } from "next/server";
import { PLANS, formatPrice } from "@/lib/products";

// GET /api/plans - returns all available plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'IN';
    
    // Format plans for dashboard consumption
    const formattedPlans = PLANS.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      projectLimit: plan.projectLimit,
      pricing: plan.pricing[country as keyof typeof plan.pricing] || plan.pricing.IN,
      features: plan.features,
      badge: plan.badge,
      formattedPrice: formatPrice(
        plan.pricing[country as keyof typeof plan.pricing]?.amount || plan.pricing.IN.amount,
        (plan.pricing[country as keyof typeof plan.pricing]?.currency || plan.pricing.IN.currency) as "INR" | "USD"
      )
    }));

    const response = NextResponse.json(formattedPlans);
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error) {
    console.error('Error fetching plans:', error);
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new Response(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

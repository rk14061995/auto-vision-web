import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";

// GET /api/projects/check-limit - check if user can create more projects
export async function GET(request: NextRequest) {
  try {
    // Get user email from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = authHeader.replace('Bearer ', '');
    
    // Get user data
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can create more projects
    const canCreateProject = user.projectsUsed < user.projectLimit;
    const projectsRemaining = user.projectLimit - user.projectsUsed;

    const response = NextResponse.json({
      canCreateProject,
      projectsRemaining,
      projectLimit: user.projectLimit,
      projectsUsed: user.projectsUsed,
      planType: user.planType
    });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  } catch (error) {
    console.error('Error checking project limit:', error);
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

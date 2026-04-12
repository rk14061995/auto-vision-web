export async function OPTIONS(request: NextRequest) {
  const res = new Response(null, { status: 204 })
  res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}
import { auth } from "@/lib/auth"
import { createCarProject, getCarProjectsByEmail, incrementProjectsUsed } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    let session = await auth();
    // Allow local dev: accept Authorization header as email
    if (!session?.user?.email) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const email = authHeader.replace('Bearer ', '').trim();
        if (email) session = { user: { email } } as any;
      }
    }
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const projects = await getCarProjectsByEmail(session.user.email);
    const res = NextResponse.json({
      success: true,
      projects,
    });
    res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    return res;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { projectName, description, carDetails, baseImage } = await request.json()

    if (!projectName || !carDetails) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create the car project
    const project = await createCarProject({
      email: session.user.email,
      projectName,
      description: description || "",
      carDetails,
      baseImage: baseImage || "",
      modifications: [],
      canvasData: "",
      status: "draft",
    })

    // Increment projects used
    await incrementProjectsUsed(session.user.email)

    const res = NextResponse.json(
      {
        success: true,
        project,
        projectId: project._id?.toString(),
      },
      { status: 201 }
    )
    res.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    return res
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

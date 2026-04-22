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
import { uploadImage } from "@/lib/cloudinary"
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

    // Parse form data using Next.js native formData()
    const formData = await request.formData()
    
    const projectName = formData.get('projectName') as string
    const description = formData.get('description') as string
    const carDetailsStr = formData.get('carDetails') as string
    const carDetails = carDetailsStr ? JSON.parse(carDetailsStr) : {}
    const baseImageFile = formData.get('baseImage') as File

    if (!projectName || !carDetails) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let imageUrl = ""
    
    // Upload image to Cloudinary if provided
    if (baseImageFile) {
      try {
        const fileBuffer = Buffer.from(await baseImageFile.arrayBuffer())
        const uploadResult = await uploadImage(fileBuffer, {
          folder: 'auto-vision/car-projects',
        })
        imageUrl = uploadResult.secure_url
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        )
      }
    }

    // Create the car project
    const project = await createCarProject({
      email: session.user.email,
      projectName,
      description: description || "",
      carDetails,
      baseImage: imageUrl,
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

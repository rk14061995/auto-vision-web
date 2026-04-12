import { auth } from "@/lib/auth";
import { getCarProjectById, updateCarProject } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic"; // prevent caching issues

// ✅ CORS helper
function setCorsHeaders(res: NextResponse, request: NextRequest) {
  const origin = request.headers.get("origin");

  res.headers.set(
    "Access-Control-Allow-Origin",
    origin || "http://localhost:3001"
  );
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization"
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");

  return res;
}

// ✅ Handle preflight
export async function OPTIONS(request: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return setCorsHeaders(res, request);
}

// ✅ GET Project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    let session = await auth();

    // fallback auth (email via header)
    if (!session?.user?.email) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const email = authHeader.replace("Bearer ", "").trim();
        if (email) session = { user: { email } } as any;
      }
    }

    if (!session?.user?.email) {
      return setCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request
      );
    }

    if (!ObjectId.isValid(projectId)) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid project ID" }, { status: 400 }),
        request
      );
    }

    const project = await getCarProjectById(projectId);

    if (!project || project.email !== session.user.email) {
      return setCorsHeaders(
        NextResponse.json({ error: "Project not found" }, { status: 404 }),
        request
      );
    }

    return setCorsHeaders(
      NextResponse.json({ success: true, project }),
      request
    );
  } catch (error) {
    console.error("GET error:", error);
    return setCorsHeaders(
      NextResponse.json(
        { error: "Failed to fetch project" },
        { status: 500 }
      ),
      request
    );
  }
}

// ✅ UPDATE Project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    let session = await auth();

    // fallback auth (same as GET)
    if (!session?.user?.email) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const email = authHeader.replace("Bearer ", "").trim();
        if (email) session = { user: { email } } as any;
      }
    }

    if (!session?.user?.email) {
      return setCorsHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        request
      );
    }

    if (!ObjectId.isValid(projectId)) {
      return setCorsHeaders(
        NextResponse.json({ error: "Invalid project ID" }, { status: 400 }),
        request
      );
    }

    const project = await getCarProjectById(projectId);

    if (!project || project.email !== session.user.email) {
      return setCorsHeaders(
        NextResponse.json({ error: "Project not found" }, { status: 404 }),
        request
      );
    }

    const body = await request.json();

    const updatedProject = await updateCarProject(projectId, {
      ...(body.projectName && { projectName: body.projectName }),
      ...(body.description !== undefined && {
        description: body.description,
      }),
      ...(body.carDetails && { carDetails: body.carDetails }),
      ...(body.modifications && { modifications: body.modifications }),
      ...(body.canvasData && { canvasData: body.canvasData }),
      ...(body.status && { status: body.status }),
    });

    return setCorsHeaders(
      NextResponse.json({ success: true, project: updatedProject }),
      request
    );
  } catch (error) {
    console.error("PUT error:", error);
    return setCorsHeaders(
      NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      ),
      request
    );
  }
}
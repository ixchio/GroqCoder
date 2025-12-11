/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const project = await Project.findById(id).lean() as any;

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const session = await getServerSession(authOptions);

    // Check if user can access this project
    if (!project.isPublic) {
      if (!session?.user?.email) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const User = (await import("@/models/User")).default;
      const user = await User.findOne({ email: session.user.email });

      if (!user || project.userId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      project: {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        authorName: project.authorName,
        authorImage: project.authorImage,
        pages: project.pages,
        prompts: project.prompts,
        thumbnail: project.thumbnail,
        isPublic: project.isPublic,
        likes: project.likes,
        forks: project.forks,
        tags: project.tags,
        model: project.model,
        provider: project.provider,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        isOwner: session?.user?.email 
          ? await isProjectOwner(project.userId, session.user.email)
          : false,
      },
    });
  } catch (error: any) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, pages, prompts, isPublic, tags, thumbnail } = body;

    await connectToDatabase();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update fields
    if (title !== undefined) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (pages !== undefined) project.pages = pages;
    if (prompts !== undefined) project.prompts = prompts;
    if (isPublic !== undefined) project.isPublic = isPublic;
    if (tags !== undefined) project.tags = tags;
    if (thumbnail !== undefined) project.thumbnail = thumbnail;

    await project.save();

    return NextResponse.json({
      ok: true,
      message: "Project updated successfully",
    });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid project ID" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const project = await Project.findById(id);

    if (!project) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    await Project.findByIdAndDelete(id);

    return NextResponse.json({
      ok: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

// Helper function to check project ownership
async function isProjectOwner(
  projectUserId: mongoose.Types.ObjectId,
  userEmail: string
): Promise<boolean> {
  try {
    const User = (await import("@/models/User")).default;
    const user = await User.findOne({ email: userEmail });
    return user && projectUserId.toString() === user._id.toString();
  } catch {
    return false;
  }
}

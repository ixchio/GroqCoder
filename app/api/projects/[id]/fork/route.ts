/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";

// POST /api/projects/[id]/fork - Fork a public project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Sign in to fork projects" },
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

    const originalProject = await Project.findById(id);

    if (!originalProject) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (!originalProject.isPublic) {
      return NextResponse.json(
        { ok: false, error: "Cannot fork private projects" },
        { status: 403 }
      );
    }

    // Create forked project
    const forkedProject = await Project.create({
      title: `${originalProject.title} (Fork)`,
      description: originalProject.description,
      userId: user._id,
      authorName: user.name,
      authorImage: user.image || "",
      pages: originalProject.pages,
      prompts: originalProject.prompts,
      thumbnail: originalProject.thumbnail,
      isPublic: false, // Forks start as private
      tags: originalProject.tags,
      model: originalProject.model,
      provider: originalProject.provider,
      forkedFrom: originalProject._id,
    });

    // Increment fork count on original
    originalProject.forks += 1;
    await originalProject.save();

    return NextResponse.json({
      ok: true,
      message: "Project forked successfully",
      project: {
        id: forkedProject._id.toString(),
        title: forkedProject.title,
      },
    });
  } catch (error: any) {
    console.error("Fork project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fork project" },
      { status: 500 }
    );
  }
}

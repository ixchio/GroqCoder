/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";

// POST /api/projects/[id]/like - Toggle like on project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Sign in to like projects" },
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

    if (!project.isPublic) {
      return NextResponse.json(
        { ok: false, error: "Cannot like private projects" },
        { status: 403 }
      );
    }

    const userIdStr = user._id.toString();
    const likedByStr = project.likedBy.map((id: mongoose.Types.ObjectId) => id.toString());
    const isLiked = likedByStr.includes(userIdStr);

    if (isLiked) {
      // Unlike
      project.likedBy = project.likedBy.filter(
        (id: mongoose.Types.ObjectId) => id.toString() !== userIdStr
      );
      project.likes = Math.max(0, project.likes - 1);
    } else {
      // Like
      project.likedBy.push(user._id);
      project.likes += 1;
    }

    await project.save();

    return NextResponse.json({
      ok: true,
      liked: !isLiked,
      likes: project.likes,
    });
  } catch (error: any) {
    console.error("Like project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to like project" },
      { status: 500 }
    );
  }
}

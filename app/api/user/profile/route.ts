/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

// GET /api/user/profile - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email }).select(
      "-password -apiKeys"
    );

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        githubUsername: user.githubUsername,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get profile" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, bio, linkedinUrl, image } = body;

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Validate LinkedIn URL if provided
    if (linkedinUrl && linkedinUrl.trim()) {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/;
      if (!linkedinRegex.test(linkedinUrl)) {
        return NextResponse.json(
          { ok: false, error: "Invalid LinkedIn URL format" },
          { status: 400 }
        );
      }
    }

    // Update fields
    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.substring(0, 500);
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl.trim();
    if (image !== undefined) user.image = image;

    await user.save();

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        bio: user.bio,
        linkedinUrl: user.linkedinUrl,
        githubUsername: user.githubUsername,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

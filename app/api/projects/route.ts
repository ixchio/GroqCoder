/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";

// GET /api/projects - Get user's projects or public gallery
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const gallery = searchParams.get("gallery") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const sort = searchParams.get("sort") || "recent"; // recent, popular, trending
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";

    await connectToDatabase();

    const query: any = {};
    let sortQuery: any = {};

    if (gallery) {
      // Public gallery - show only public projects
      query.isPublic = true;
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ];
      }
      
      if (tag) {
        query.tags = tag;
      }

      switch (sort) {
        case "popular":
          sortQuery = { likes: -1, createdAt: -1 };
          break;
        case "trending":
          // Projects with most likes in last 7 days
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query.createdAt = { $gte: weekAgo };
          sortQuery = { likes: -1, createdAt: -1 };
          break;
        default:
          sortQuery = { createdAt: -1 };
      }
    } else {
      // User's own projects
      if (!session?.user?.email) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      const User = (await import("@/models/User")).default;
      const user = await User.findOne({ email: session.user.email });
      
      if (!user) {
        return NextResponse.json(
          { ok: false, error: "User not found" },
          { status: 404 }
        );
      }

      query.userId = user._id;
      sortQuery = { updatedAt: -1 };
    }

    const skip = (page - 1) * limit;
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select({ pages: { $slice: 1 } }) // Get only the first page for preview
        .lean(),
      Project.countDocuments(query),
    ]);

    return NextResponse.json({
      ok: true,
      projects: projects.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        authorName: p.authorName,
        authorImage: p.authorImage,
        thumbnail: p.thumbnail,
        pages: p.pages,
        isPublic: p.isPublic,
        likes: p.likes,
        forks: p.forks,
        tags: p.tags,
        model: p.model,
        provider: p.provider,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, pages, prompts, isPublic, tags, model, provider } = body;

    if (!title || !pages?.length) {
      return NextResponse.json(
        { ok: false, error: "Title and at least one page are required" },
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

    const project = await Project.create({
      title: title.trim(),
      description: description?.trim() || "",
      userId: user._id,
      authorName: user.name,
      authorImage: user.image || "",
      pages,
      prompts: prompts || [],
      isPublic: isPublic || false,
      tags: tags || [],
      model: model || "llama-3.3-70b-versatile",
      provider: provider || "groq",
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Project created successfully",
        project: {
          id: project._id.toString(),
          title: project.title,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}

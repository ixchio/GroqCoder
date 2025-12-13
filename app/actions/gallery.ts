"use server";

import { connectToDatabase } from "@/lib/mongodb";
import Project from "@/models/Project";
import { Project as ProjectType } from "@/types";

interface GalleryFilters {
  page?: number;
  limit?: number;
  sort?: "recent" | "popular" | "trending";
  search?: string;
  tag?: string;
}

export async function getGalleryProjects(filters: GalleryFilters = {}): Promise<{
  ok: boolean;
  projects: ProjectType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  try {
    const {
      page = 1,
      limit = 12,
      sort = "recent",
      search = "",
      tag = "",
    } = filters;

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { isPublic: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortQuery: any = {};

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
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query.createdAt = { $gte: weekAgo };
        sortQuery = { likes: -1, createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .select("-pages") // Don't include full HTML in list
        .lean(),
      Project.countDocuments(query),
    ]);

    return {
      ok: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projects: projects.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description || "",
        userId: p.userId?.toString() || "",
        authorName: p.authorName || "Anonymous",
        authorImage: p.authorImage || "",
        pages: [],
        prompts: p.prompts || [],
        thumbnail: p.thumbnail || "",
        isPublic: p.isPublic,
        likes: p.likes || 0,
        forks: p.forks || 0,
        tags: p.tags || [],
        model: p.model || "",
        provider: p.provider || "",
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) as ProjectType[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get gallery projects error:", error);
    return {
      ok: false,
      projects: [],
      pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
